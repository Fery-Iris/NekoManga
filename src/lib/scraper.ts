import * as cheerio from 'cheerio';
import { Comic, ComicInfo, Chapter, ChapterDetail, Genre } from './types';
import { getCache, setCache } from './cache';
import fallbackData from './fallbackData.json';
import fallbackGenres from './fallbackGenres.json';

const BASE_URL = process.env.BASE_URL || 'https://komiku.org/';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  Referer: 'https://komiku.org/',
  'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

function toTranslateGoogUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/\./g, '-');
    u.hostname = `${host}.translate.goog`;
    u.searchParams.set('_x_tr_sl', 'en');
    u.searchParams.set('_x_tr_tl', 'id');
    u.searchParams.set('_x_tr_hl', 'id');
    u.searchParams.set('_x_tr_pto', 'wapp');
    return u.toString();
  } catch {
    return url;
  }
}

async function fetchHTML(url: string): Promise<cheerio.CheerioAPI> {
  const fetchHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  };

  // 1. Primary: Jina AI Reader Proxy - Bypasses Cloudflare bot protection & datacenter IP blocks completely
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'X-Return-Format': 'html',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const html = await res.text();
      if (html && html.length > 500 && !html.includes('Attention Required! | Cloudflare')) {
        return cheerio.load(html);
      }
    }
  } catch {
    // try fallbacks
  }

  // 2. Secondary: Optional ScraperAPI (if SCRAPER_API_KEY is configured in env)
  if (process.env.SCRAPER_API_KEY) {
    try {
      const proxyUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const html = await res.text();
        if (html && html.length > 500) {
          return cheerio.load(html);
        }
      }
    } catch {}
  }

  // 3. Direct fetch with browser headers
  try {
    const res = await fetch(url, {
      headers: {
        ...fetchHeaders,
        Referer: 'https://komiku.org/',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();
      if (html && html.length > 500 && !html.includes('Attention Required! | Cloudflare')) {
        return cheerio.load(html);
      }
    }
  } catch {
    // direct fetch failed
  }

  // 4. Fallback: Google Translate Mirror (.translate.goog)
  try {
    const googUrl = toTranslateGoogUrl(url);
    const res = await fetch(googUrl, {
      headers: fetchHeaders,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const html = await res.text();
      if (html && html.length > 500 && !html.includes('<title>Translate</title>') && !html.includes('Attention Required! | Cloudflare')) {
        return cheerio.load(html);
      }
    }
  } catch {}

  throw new Error(`Failed to fetch HTML from ${url}`);
}

function cleanEndpoint(rawHref: string): string {
  if (!rawHref) return '';
  // Handle Google proxy URL parameter
  if (rawHref.includes('u=http')) {
    try {
      const urlObj = new URL(rawHref, 'https://translate.google.com');
      const uParam = urlObj.searchParams.get('u');
      if (uParam) {
        const match = uParam.match(/\/manga\/([^/?#]+)/i);
        if (match) return `/${match[1]}/`;
        const pathPart = uParam.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
        if (pathPart) return pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
      }
    } catch {}
  }

  // Remove host (including *.translate.goog and api-*-*.translate.goog)
  let ep = rawHref.replace(/^https?:\/\/[^/]+/, '');
  // Remove query params (translate.goog appends _x_tr_* params)
  ep = ep.split('?')[0];
  // Remove fragment
  ep = ep.split('#')[0];
  // Remove /manga/ prefix if present
  ep = ep.replace(/^\/?manga\//, '/');

  if (!ep || ep === '/') return '';
  if (!ep.startsWith('/')) ep = '/' + ep;
  if (!ep.endsWith('/')) ep = ep + '/';
  return ep;
}

function cleanImage(imgEl: ReturnType<cheerio.CheerioAPI>): string {
  let src = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('src') || '';
  if (src.includes('lazy.jpg') || src.includes('lazy.png')) {
    src = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '';
  }
  if (!src) src = imgEl.attr('src') || '';
  if (src.includes('translate.goog')) {
    src = src.replace(/https?:\/\/([a-z0-9-]+)\.translate\.goog/i, (_, host) => `https://${host.replace(/-/g, '.')}`).split('?')[0];
  }
  if (src.includes('thumbnail.komiku.to')) {
    src = src.replace('thumbnail.komiku.to', 'thumbnail.komiku.org');
  }
  return src;
}

function parseComicCards($: cheerio.CheerioAPI): Comic[] {
  const comics: Comic[] = [];
  const seen = new Set<string>();

  const addComic = (title: string, image: string, type: string, endpoint: string) => {
    if (!title || !endpoint || seen.has(endpoint)) return;
    seen.add(endpoint);
    comics.push({ title, image, type: type || 'Manga', endpoint });
  };

  // 1. .ls4 (homepage ranking / hot)
  $('.ls4').each((_, el) => {
    const $el = $(el);
    const titleA = $el.find('h4 a, h3 a').first();
    const title = titleA.text().trim() || $el.find('h4, h3').text().trim();
    const link = titleA.attr('href') || $el.find('a[href*="/manga/"]').attr('href');
    const endpoint = cleanEndpoint(link || '');
    const image = cleanImage($el.find('img').first());
    const type = $el.find('.ls4s').text().split('·')[0]?.trim() || 'Manga';
    if (title && image) addComic(title, image, type, endpoint);
  });

  // 2. .ls2 (homepage latest / library)
  $('.ls2').each((_, el) => {
    const $el = $(el);
    const titleA = $el.find('h4 a, h3 a').first();
    const title = titleA.text().trim() || $el.find('h4, h3').text().trim();
    const link = titleA.attr('href') || $el.find('a[href*="/manga/"]').attr('href');
    const endpoint = cleanEndpoint(link || '');
    const image = cleanImage($el.find('img').first());
    const type = $el.find('.type, .tpe1_inf b').text().trim() || 'Manga';
    if (title && image) addComic(title, image, type, endpoint);
  });

  // 3. .bge (list/search style)
  $('.bge').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('a[href*="/manga/"], a').first();
    const title = $el.find('.kan h3, h3').text().trim() || $a.text().trim();
    const endpoint = cleanEndpoint($a.attr('href') || '');
    const image = cleanImage($el.find('img').first());
    const type = $el.find('.tpe1_inf b, .type').text().trim() || 'Manga';
    if (title && image) addComic(title, image, type, endpoint);
  });

  // 4. .manga-card (browse style)
  $('.manga-card').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h4 a, h4, h3 a, h3').first().text().trim();
    const endpoint = cleanEndpoint($el.find('a[href*="/manga/"]').attr('href') || '');
    const image = cleanImage($el.find('img').first());
    let type = $el.find('.meta').text().trim().split(/\s+/)[0] || 'Manga';
    if (type.includes('Status')) type = 'Manga';
    if (title && image && endpoint) addComic(title, image, type, endpoint);
  });

  // 5. Generic article fallback
  $('article:has(a[href*="/manga/"])').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('a[href*="/manga/"]').first();
    const title = $el.find('h3, h4').first().text().trim() || $a.text().trim();
    const endpoint = cleanEndpoint($a.attr('href') || '');
    const image = cleanImage($el.find('img').first());
    if (title && image) addComic(title, image, 'Manga', endpoint);
  });

  return comics;
}

// ====== MANGA QUERIES ======

export async function getAllComic(filter: string): Promise<Comic[]> {
  const cacheKey = `all_comic_${filter}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let result: Comic[] = [];
  try {
    let url = `${BASE_URL}daftar-komik/`;
    if (filter) url = `${BASE_URL}daftar-komik/?tipe=${filter}`;
    const $ = await fetchHTML(url);
    result = parseComicCards($);
  } catch {}

  if (result.length === 0) {
    // Fallback to static seed data
    const all = fallbackData as Comic[];
    if (filter) {
      result = all.filter((c) => (c.type || '').toLowerCase().includes(filter.toLowerCase()));
    } else {
      result = all.slice(0, 30);
    }
  }

  setCache(cacheKey, result);
  return result;
}

export async function getComicByLetter(letter: string, tipe: string, page: number): Promise<Comic[]> {
  const cacheKey = `browse_${letter}_${tipe}_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let result: Comic[] = [];
  try {
    let url = page > 1
      ? `${BASE_URL}daftar-komik/page/${page}/?huruf=${letter}`
      : `${BASE_URL}daftar-komik/?huruf=${letter}`;

    if (tipe) url += `&tipe=${tipe}`;
    const $ = await fetchHTML(url);
    result = parseComicCards($);
  } catch {}

  if (result.length === 0) {
    const all = fallbackData as Comic[];
    let filtered = all;
    if (letter) {
      filtered = filtered.filter((c) => c.title.toLowerCase().startsWith(letter.toLowerCase()));
    }
    if (tipe) {
      filtered = filtered.filter((c) => (c.type || '').toLowerCase().includes(tipe.toLowerCase()));
    }
    const startIndex = (page - 1) * 15;
    result = filtered.slice(startIndex, startIndex + 15);
    if (result.length === 0) {
      result = all.slice(0, 15);
    }
  }

  setCache(cacheKey, result);
  return result;
}

export async function advancedFilterManga(orderby: string, tipe: string, genre: string, status: string, page: number): Promise<Comic[]> {
  const cacheKey = `adv_${orderby}_${tipe}_${genre}_${status}_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let result: Comic[] = [];
  try {
    let url = page > 1
      ? `${BASE_URL}daftar-komik/page/${page}/`
      : `${BASE_URL}daftar-komik/`;

    const params: string[] = [];
    if (orderby) params.push(`orderby=${orderby}`);
    if (tipe) params.push(`tipe=${tipe}`);
    if (genre) params.push(`genre=${genre}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) url += '?' + params.join('&');

    const $ = await fetchHTML(url);
    result = parseComicCards($);
  } catch {}

  if (result.length === 0) {
    const all = fallbackData as Comic[];
    let filtered = all;
    if (tipe) {
      filtered = filtered.filter((c) => (c.type || '').toLowerCase().includes(tipe.toLowerCase()));
    }
    const startIndex = (page - 1) * 15;
    result = filtered.slice(startIndex, startIndex + 15);
    if (result.length === 0) {
      result = all.slice(0, 15);
    }
  }

  setCache(cacheKey, result);
  return result;
}

export async function getComicInfo(endpoint: string): Promise<ComicInfo> {
  const cacheKey = `comic_info_${endpoint}`;
  const cached = getCache<ComicInfo>(cacheKey);
  if (cached) return cached;

  const safeSlug = endpoint.replace(/^\/+|\/+$/g, '').replace(/^manga\//, '');
  const url = `${BASE_URL}manga/${safeSlug}/`;

  let $;
  try {
    $ = await fetchHTML(url);
  } catch {
    try {
      $ = await fetchHTML(`https://api.komiku.org/manga/${safeSlug}/`);
    } catch {}
  }

  if ($) {
    const title = $('#Judul h1, .manga-info h1, h1').first().text().trim();
    let thumbnail = $('.manga-info img, .ims img, .thumb img').attr('data-src') || $('.manga-info img, .ims img, .thumb img').attr('src') || '';
    if (thumbnail.includes('thumbnail.komiku.to')) {
      thumbnail = thumbnail.replace('thumbnail.komiku.to', 'thumbnail.komiku.org');
    }
    if (thumbnail.includes('translate.goog')) {
      thumbnail = thumbnail.replace(/https?:\/\/([a-z0-9-]+)\.translate\.goog/i, (_, host) => `https://${host.replace(/-/g, '.')}`).split('?')[0];
    }
    const type = $('a[href*="/tipe/"]').text().trim() || 'Manga';
    const status = $('td:contains("Status"), th:contains("Status")').next().text().trim() || $('span:contains("Status")').text().replace('Status', '').trim() || 'Ongoing';
    const author = $('td:contains("Pengarang"), th:contains("Pengarang")').next().text().trim() || $('span:contains("Author")').text().replace('Author', '').trim() || '-';
    const rating = $('td:contains("Rating"), th:contains("Rating")').next().text().trim() || $('.rating-star').text().trim() || '8.5';
    
    // Synopsis: try multiple selectors — #Sinopsis is a <section id="Sinopsis">
    let synopsis = '';
    const synopSection = $('#Sinopsis');
    if (synopSection.length) {
      synopsis = synopSection.find('p').text().trim();
      if (!synopsis) synopsis = synopSection.text().trim();
    }
    if (!synopsis) synopsis = $('.desc p, .sinopsis p').first().text().trim();
    if (!synopsis) synopsis = 'Sinopsis belum tersedia.';

    const comicInfo: ComicInfo = {
      title,
      thumbnail,
      type,
      author,
      status,
      rating,
      synopsis,
      genre: [],
      chapter_list: [],
    };

    $('ul.genre li a, .genre a').each((_, el) => {
      const g = $(el).text().trim();
      if (g) comicInfo.genre.push(g);
    });

    // Chapter list: structure is <table id="Daftar_Chapter"><tbody id="daftarChapter">
    // Each chapter row: <tr><td class="judulseries"><a href>Chapter Name</a></td><td class="tanggalseries">Date</td></tr>
    // Skip the header row (first tr has <th> not <td>)
    $('#daftarChapter tr').each((_, el) => {
      const td = $(el).find('td.judulseries');
      if (td.length === 0) return; // skip header row with <th>
      const a = td.find('a');
      if (a.length > 0) {
        const ep = cleanEndpoint(a.attr('href') || '');
        if (!ep) return;
        // Date is sibling td.tanggalseries
        const date = $(el).find('.tanggalseries').text().trim() || '-';
        comicInfo.chapter_list.push({
          name: a.text().trim(),
          endpoint: ep,
          date,
        });
      }
    });
    
    // Fallback: older selector styles
    if (comicInfo.chapter_list.length === 0) {
      $('#Chapter_List_Items li, .lchx').each((_, el) => {
        const a = $(el).find('a');
        if (a.length > 0) {
          const ep = cleanEndpoint(a.attr('href') || '');
          if (!ep) return;
          const date = $(el).find('.tanggalseries, .dt').text().trim() ||
            $(el).siblings('.tanggalseries, .dt').text().trim() || '-';
          comicInfo.chapter_list.push({ name: a.text().trim(), endpoint: ep, date });
        }
      });
    }

    if (comicInfo.title) {
      setCache(cacheKey, comicInfo, 10 * 60 * 1000);
      return comicInfo;
    }
  }

  // Fallback info from static data
  const fallbackMatch = (fallbackData as Comic[]).find(
    (c) => c.endpoint.includes(safeSlug) || safeSlug.includes(c.endpoint.replace(/\//g, ''))
  );

  const fallbackTitle = fallbackMatch ? fallbackMatch.title : safeSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const fallbackThumbnail = fallbackMatch ? fallbackMatch.image : '';

  const fallbackInfo: ComicInfo = {
    title: fallbackTitle,
    thumbnail: fallbackThumbnail,
    type: fallbackMatch?.type || 'Manga',
    author: 'Unknown',
    status: 'Ongoing',
    rating: '8.5',
    synopsis: `${fallbackTitle} adalah serial komik yang menarik dan populer untuk dibaca.`,
    genre: ['Action', 'Fantasy', 'Adventure'],
    chapter_list: [
      { name: 'Chapter 03', endpoint: `/${safeSlug}-chapter-03/`, date: 'Terbaru' },
      { name: 'Chapter 02', endpoint: `/${safeSlug}-chapter-02/`, date: 'Kemarin' },
      { name: 'Chapter 01', endpoint: `/${safeSlug}-chapter-01/`, date: 'Awal' },
    ],
  };

  setCache(cacheKey, fallbackInfo, 5 * 60 * 1000);
  return fallbackInfo;
}

export async function searchManga(query: string, genre?: string): Promise<Comic[]> {
  const cacheKey = `search_${query}_${genre || 'all'}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let result: Comic[] = [];

  // 1. Multi-page parallel search on Komiku's official HTMX search endpoint
  try {
    const maxPages = 4;
    const pages = Array.from({ length: maxPages }, (_, i) => i + 1);
    const pageResults = await Promise.all(
      pages.map(async (page) => {
        try {
          const url = page === 1
            ? `https://api.komiku.org/?post_type=manga&s=${encodeURIComponent(query)}`
            : `https://api.komiku.org/page/${page}/?post_type=manga&s=${encodeURIComponent(query)}`;
          const $ = await fetchHTML(url);
          return parseComicCards($);
        } catch {
          return [];
        }
      })
    );
    const seen = new Set<string>();
    for (const list of pageResults) {
      for (const item of list) {
        if (!seen.has(item.endpoint)) {
          seen.add(item.endpoint);
          result.push(item);
        }
      }
    }
  } catch {}

  // 2. Direct search endpoint fallback
  if (result.length === 0) {
    try {
      let url = `https://api.komiku.org/manga/?s=${encodeURIComponent(query)}`;
      if (genre) {
        url += `&genre=${encodeURIComponent(genre)}`;
      }
      const $ = await fetchHTML(url);
      result = parseComicCards($);
    } catch {}
  }

  // 3. Fallback to local filter
  if (result.length === 0) {
    const all = fallbackData as Comic[];
    result = all.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));
  }

  setCache(cacheKey, result, 3 * 60 * 1000);
  return result;
}

export async function getAllGenre(): Promise<Genre[]> {
  const cacheKey = 'all_genres';
  const cached = getCache<Genre[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let genres: Genre[] = [];
  try {
    const url = `${BASE_URL}pustaka/`;
    const $ = await fetchHTML(url);
    $('select[name="genre"] option').each((_, el) => {
      const value = $(el).attr('value');
      if (value && value !== '') {
        const title = $(el).text().trim().replace(/\s*\([\d\.]+\)$/, '').trim();
        genres.push({ endpoint: value, title });
      }
    });
  } catch {}

  if (genres.length === 0) {
    genres = fallbackGenres as Genre[];
  }

  setCache(cacheKey, genres, 30 * 60 * 1000);
  return genres;
}

export async function getPopularManga(page: number): Promise<Comic[]> {
  const cacheKey = `popular_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let result: Comic[] = [];
  try {
    if (page === 1) {
      const $ = await fetchHTML(BASE_URL);
      $('.ls4').each((_, el) => {
        const $el = $(el);
        const titleA = $el.find('h4 a, h3 a').first();
        const title = titleA.text().trim() || $el.find('h4, h3').text().trim();
        const link = titleA.attr('href') || $el.find('a[href*="/manga/"]').attr('href');
        const endpoint = cleanEndpoint(link || '');
        const image = cleanImage($el.find('img').first());
        const type = $el.find('.ls4s').text().split('·')[0]?.trim() || 'Manga';
        if (title && image && endpoint) {
          result.push({ title, image, type, endpoint });
        }
      });
    } else {
      const url = `${BASE_URL}daftar-komik/page/${page}/?orderby=meta_value_num`;
      const $ = await fetchHTML(url);
      result = parseComicCards($).slice(0, 15);
    }
  } catch {}

  if (result.length === 0) {
    const all = fallbackData as Comic[];
    const startIndex = (page - 1) * 15;
    result = all.slice(startIndex, startIndex + 15);
    if (result.length === 0) result = all.slice(0, 15);
  }

  setCache(cacheKey, result, 15 * 60 * 1000);
  return result;
}

export async function getRecommendedManga(page: number): Promise<Comic[]> {
  const cacheKey = `recommended_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let result: Comic[] = [];
  try {
    const url = page > 1
      ? `${BASE_URL}daftar-komik/page/${page}/?tipe=manhwa`
      : `${BASE_URL}daftar-komik/?tipe=manhwa`;
    const $ = await fetchHTML(url);
    result = parseComicCards($).slice(0, 15);
  } catch {}

  if (result.length === 0) {
    try {
      const $ = await fetchHTML(BASE_URL);
      const allParsed = parseComicCards($);
      result = allParsed.slice(15, 30);
    } catch {}
  }

  if (result.length === 0) {
    const all = fallbackData as Comic[];
    const startIndex = 15 + (page - 1) * 15;
    result = all.slice(startIndex, startIndex + 15);
    if (result.length === 0) result = all.slice(15, 30);
  }

  setCache(cacheKey, result, 15 * 60 * 1000);
  return result;
}

export async function getNewestManga(page: number): Promise<Comic[]> {
  const cacheKey = `newest_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let result: Comic[] = [];
  try {
    if (page === 1) {
      const $ = await fetchHTML(BASE_URL);
      $('.ls2').each((_, el) => {
        const $el = $(el);
        const titleA = $el.find('h4 a, h3 a').first();
        const title = titleA.text().trim() || $el.find('h4, h3').text().trim();
        const link = titleA.attr('href') || $el.find('a[href*="/manga/"]').attr('href');
        const endpoint = cleanEndpoint(link || '');
        const image = cleanImage($el.find('img').first());
        const type = $el.find('.type, .tpe1_inf b').text().trim() || 'Manga';
        if (title && image && endpoint) {
          result.push({ title, image, type, endpoint });
        }
      });
      result = result.slice(0, 15);
    } else {
      const url = `${BASE_URL}daftar-komik/page/${page}/?orderby=modified`;
      const $ = await fetchHTML(url);
      result = parseComicCards($).slice(0, 15);
    }
  } catch {}

  if (result.length === 0) {
    const all = fallbackData as Comic[];
    const startIndex = 30 + (page - 1) * 15;
    result = all.slice(startIndex, startIndex + 15);
    if (result.length === 0) result = all.slice(30, 45);
  }

  setCache(cacheKey, result, 15 * 60 * 1000);
  return result;
}

export async function getByGenre(endpoint: string, page: number): Promise<Comic[]> {
  const cacheKey = `genre_${endpoint}_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  let result: Comic[] = [];
  try {
    const url = page !== 1
      ? `${BASE_URL}genre/${endpoint}/page/${page}/`
      : `${BASE_URL}genre/${endpoint}/`;
    const $ = await fetchHTML(url);
    result = parseComicCards($);
  } catch {}

  if (result.length === 0) {
    const all = fallbackData as Comic[];
    result = all.filter((c) => (c.type || '').toLowerCase().includes(endpoint.toLowerCase()));
    if (result.length === 0) result = all.slice(0, 15);
  }

  setCache(cacheKey, result);
  return result;
}

// ====== CHAPTER QUERIES ======

export async function getListChapter(endpoint: string): Promise<Chapter[]> {
  const cacheKey = `chapter_list_${endpoint}`;
  const cached = getCache<Chapter[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const safeSlug = endpoint.replace(/^\/+|\/+$/g, '').replace(/^manga\//, '');
  const url = `${BASE_URL}manga/${safeSlug}/`;
  const chapters: Chapter[] = [];

  try {
    const $ = await fetchHTML(url);
    // Primary: new table structure
    $('#daftarChapter tr').each((_, el) => {
      const td = $(el).find('td.judulseries');
      if (td.length === 0) return;
      const a = td.find('a');
      if (a.length > 0) {
        const chapterEndpoint = cleanEndpoint(a.attr('href') || '');
        if (!chapterEndpoint) return;
        const date = $(el).find('.tanggalseries').text().trim() || '-';
        chapters.push({ name: a.text().trim(), endpoint: chapterEndpoint, date });
      }
    });
    // Fallback: older styles
    if (chapters.length === 0) {
      $('#Chapter_List_Items li, .lchx').each((_, el) => {
        const a = $(el).find('a');
        if (a.length > 0) {
          const chapterEndpoint = cleanEndpoint(a.attr('href') || '');
          if (!chapterEndpoint) return;
          const date = $(el).find('.tanggalseries, .dt').text().trim() ||
            $(el).siblings('.tanggalseries, .dt').text().trim() || '-';
          chapters.push({ name: a.text().trim(), endpoint: chapterEndpoint, date });
        }
      });
    }
  } catch {}

  if (chapters.length === 0) {
    chapters.push(
      { name: 'Chapter 03', endpoint: `/${safeSlug}-chapter-03/`, date: 'Terbaru' },
      { name: 'Chapter 02', endpoint: `/${safeSlug}-chapter-02/`, date: 'Kemarin' },
      { name: 'Chapter 01', endpoint: `/${safeSlug}-chapter-01/`, date: 'Awal' }
    );
  }

  setCache(cacheKey, chapters, 10 * 60 * 1000);
  return chapters;
}

export async function getChapterDetail(endpoint: string): Promise<ChapterDetail> {
  const cacheKey = `chapter_detail_${endpoint}`;
  const cached = getCache<ChapterDetail>(cacheKey);
  if (cached) return cached;

  const safeEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  const url = `${BASE_URL}${safeEndpoint}/`;

  let images: string[] = [];
  let title = '';
  let next_chapter: string | undefined;
  let prev_chapter: string | undefined;

  try {
    const $ = await fetchHTML(url);
    $('#Baca_Komik img, .reader-area img, #chimg-auh img').each((_, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src && !src.includes('lazy.jpg') && !src.includes('lazy.png')) {
        // Filter out promotional/banner images
        if (src.includes('komiku-promosi') || src.includes('banner') || src.includes('promo')) return;
        if (src.includes('translate.goog')) {
          src = src.replace(/https?:\/\/([a-z0-9-]+)\.translate\.goog/i, (_, host) => `https://${host.replace(/-/g, '.')}`);
        }
        if (src.includes('thumbnail.komiku.to')) {
          src = src.replace('thumbnail.komiku.to', 'thumbnail.komiku.org');
        }
        images.push(src);
      }
    });

    // h1 has the correct title (e.g. "Magic Emperor Chapter 921")
    // .judulbaca returns "Baca Online" which we skip
    title = $('h1').first().text().trim();
    if (!title || title.toLowerCase().startsWith('baca')) {
      title = $('.mk-chapter__title, .chapter-title').first().text().trim();
    }

    // Next/Prev chapter: komiku uses aria-label="Prev" / aria-label="Next" on <a class="btn">
    // The "Prev" link (lower chapter number) is usually shown for the "previous" chapter
    // and "Next" is not present when on the latest chapter
    $('a[aria-label="Prev"], a.rl').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !prev_chapter && !href.includes('#')) {
        prev_chapter = cleanEndpoint(href);
      }
    });

    $('a[aria-label="Next"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !next_chapter && !href.includes('#')) {
        next_chapter = cleanEndpoint(href);
      }
    });
    
    // Fallback: old selectors
    if (!prev_chapter && !next_chapter) {
      $('a:contains("Next"), a:contains("Next Chapter"), a.nx').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !next_chapter && !href.includes('#')) next_chapter = cleanEndpoint(href);
      });
      $('a:contains("Prev"), a:contains("Prev Chapter"), a.pr').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !prev_chapter && !href.includes('#')) prev_chapter = cleanEndpoint(href);
      });
    }
  } catch {}

  if (!title) {
    title = safeEndpoint.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  const detail: ChapterDetail = { title, image: images, next_chapter, prev_chapter };
  if (images.length > 0) {
    setCache(cacheKey, detail, 30 * 60 * 1000);
  }
  return detail;
}
