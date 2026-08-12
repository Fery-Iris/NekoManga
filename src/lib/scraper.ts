import * as cheerio from 'cheerio';
import { Comic, ComicInfo, Chapter, ChapterDetail, Genre } from './types';
import { getCache, setCache } from './cache';

const BASE_URL = process.env.BASE_URL || 'https://komiku.org/';

async function fetchHTML(url: string): Promise<cheerio.CheerioAPI> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    next: { revalidate: 300 }, // 5 min ISR cache
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  return cheerio.load(html);
}

function parseComicCards($: cheerio.CheerioAPI): Comic[] {
  const comics: Comic[] = [];
  
  // Try .ls4 (homepage style)
  $('.ls4').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('.ls4j h4 a');
    if ($a.length === 0) return;
    
    let endpoint = $a.attr('href') || '';
    endpoint = endpoint.replace(BASE_URL, '').replace(/^\/?manga\//, '/');
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    
    const titleText = $a.text().trim();
    const image = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
    const typeText = $el.find('.ls4s').text().split('·')[0]?.trim() || '';
    
    comics.push({ title: titleText, image, type: typeText, endpoint });
  });

  if (comics.length > 0) return comics;

  // Try .bge (list/search style)
  $('.bge').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('a').first();
    let endpoint = $a.attr('href') || '';
    endpoint = endpoint.replace(BASE_URL, '').replace(/^\/?manga\//, '/');
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

    const titleText = $el.find('.kan h3').text().trim();
    const image = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
    const typeText = $el.find('.tpe1_inf b').text().trim();

    if (titleText) {
      comics.push({ title: titleText, image, type: typeText, endpoint });
    }
  });

  if (comics.length > 0) return comics;

  // Try new .manga-card (new komiku list/browse style)
  $('.manga-card').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('h4 a');
    let endpoint = $a.attr('href') || '';
    endpoint = endpoint.replace(BASE_URL, '').replace(/^\/?manga\//, '/');
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

    const titleText = $a.text().trim();
    const image = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
    let typeText = $el.find('.meta').text().trim().split(/\s+/)[0] || '';
    
    // Filter out if typeText happens to be "Status:"
    if (typeText.includes('Status')) typeText = 'Manga';

    if (titleText) {
      comics.push({ title: titleText, image, type: typeText, endpoint });
    }
  });

  if (comics.length > 0) return comics;

  // Generic fallback for other themes
  $('.animepost, .bs, .listupd .bsx').each((_, el) => {
    const $el = $(el);
    const $a = $el.find('a').first();
    let endpoint = $a.attr('href') || '';
    endpoint = endpoint.replace(BASE_URL, '').replace(/^\/?manga\//, '/');
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

    const titleText = $el.find('.tt h4, .tt h2, .kan h3, h3').text().trim();
    const image = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
    const typeText = $el.find('.type').text().trim();

    if (titleText) {
      comics.push({ title: titleText, image, type: typeText, endpoint });
    }
  });

  return comics;
}

// ====== MANGA QUERIES ======

export async function getAllComic(filter: string): Promise<Comic[]> {
  const cacheKey = `all_comic_${filter}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  let url = `${BASE_URL}daftar-komik/`;
  if (filter) url = `${BASE_URL}pustaka/?tipe=${filter}`;

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result);
  return result;
}

export async function getComicByLetter(letter: string, tipe: string, page: number): Promise<Comic[]> {
  const cacheKey = `browse_${letter}_${tipe}_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  let url = page > 1
    ? `${BASE_URL}daftar-komik/page/${page}/?huruf=${letter}`
    : `${BASE_URL}daftar-komik/?huruf=${letter}`;

  if (tipe) url += `&tipe=${tipe}`;

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result);
  return result;
}

export async function advancedFilterManga(orderby: string, tipe: string, genre: string, status: string, page: number): Promise<Comic[]> {
  const cacheKey = `adv_${orderby}_${tipe}_${genre}_${status}_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  let url = page > 1
    ? `https://api.komiku.org/manga/page/${page}/`
    : `https://api.komiku.org/manga/`;

  const params: string[] = [];
  if (orderby) params.push(`orderby=${orderby}`);
  if (tipe) params.push(`tipe=${tipe}`);
  if (genre) params.push(`genre=${genre}`);
  if (status) params.push(`status=${status}`);
  if (params.length > 0) url += '?' + params.join('&');

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result);
  return result;
}

export async function getComicInfo(endpoint: string): Promise<ComicInfo> {
  const cacheKey = `comic_info_${endpoint}`;
  const cached = getCache<ComicInfo>(cacheKey);
  if (cached) return cached;

  let safeEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  if (!safeEndpoint.endsWith('/')) safeEndpoint += '/';
  const url = BASE_URL + 'manga' + safeEndpoint;
  const $ = await fetchHTML(url);

  const title = $('#Judul h1, .manga-info h1, h1').first().text().trim();
  const thumbnail = $('.manga-info img, .ims img, .thumb img').attr('data-src') || $('.manga-info img, .ims img, .thumb img').attr('src') || '';
  const type = $('a[href*="/tipe/"]').text().trim();
  const status = $('td:contains("Status"), th:contains("Status")').next().text().trim() || $('span:contains("Status")').text().replace('Status', '').trim();
  const author = $('td:contains("Pengarang"), th:contains("Pengarang")').next().text().trim() || $('span:contains("Author")').text().replace('Author', '').trim();
  const rating = $('td:contains("Rating"), th:contains("Rating")').next().text().trim() || $('.rating-star').text().trim();
  const synopsis = $('#Sinopsis p, .desc p, .sinopsis p').text().trim();

  const comicInfo: ComicInfo = {
    title, thumbnail, type, author, status, rating, synopsis,
    genre: [],
    chapter_list: [],
  };

  $('ul.genre li a, .genre a').each((_, el) => {
    comicInfo.genre.push($(el).text().trim());
  });

  $('#Chapter_List_Items li, .lchx, #Daftar_Chapter td.judulseries').each((_, el) => {
    const a = $(el).find('a');
    if (a.length > 0) {
      let ep = a.attr('href') || '';
      ep = ep.replace(BASE_URL, '');
      if (!ep.startsWith('/')) ep = '/' + ep;
      
      let date = $(el).find('.tanggalseries, .dt').text().trim();
      if (!date) date = $(el).next('.tanggalseries, .dt').text().trim();
      
      comicInfo.chapter_list.push({
        name: a.text().trim(),
        endpoint: ep,
        date: date || '-'
      });
    }
  });

  setCache(cacheKey, comicInfo, 10 * 60 * 1000); 
  return comicInfo;
}

export async function searchManga(query: string, genre?: string): Promise<Comic[]> {
  const cacheKey = `search_${query}_${genre || 'all'}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  let url = `https://api.komiku.org/manga/?s=${encodeURIComponent(query)}`;
  if (genre) {
    url += `&genre=${encodeURIComponent(genre)}`;
  }

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result, 3 * 60 * 1000);
  return result;
}

export async function getAllGenre(): Promise<Genre[]> {
  const cacheKey = 'all_genres';
  const cached = getCache<Genre[]>(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}pustaka/`;
  const $ = await fetchHTML(url);
  const genres: Genre[] = [];

  $('select[name="genre"] option').each((_, el) => {
    const value = $(el).attr('value');
    if (value && value !== '') {
      let title = $(el).text().trim();
      // Remove the count like "Action (1.234)" -> "Action"
      title = title.replace(/\s*\([\d\.]+\)$/, '').trim();
      
      genres.push({
        endpoint: value,
        title: title
      });
    }
  });

  setCache(cacheKey, genres, 30 * 60 * 1000);
  return genres;
}

export async function getPopularManga(page: number): Promise<Comic[]> {
  const cacheKey = `popular_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  const url = page !== 1
    ? `${BASE_URL}other/hot/page/${page}/`
    : `${BASE_URL}other/hot/`;

  let $;
  let result: Comic[] = [];
  try {
    $ = await fetchHTML(url);
    result = parseComicCards($);
  } catch {
    // silently fail
  }
  
  if (result.length === 0) {
    $ = await fetchHTML(BASE_URL);
    result = parseComicCards($);
    // Shuffle or just return to avoid empty states
    result = result.slice(0, 10);
  }

  setCache(cacheKey, result);
  return result;
}

export async function getRecommendedManga(page: number): Promise<Comic[]> {
  const cacheKey = `recommended_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  const url = page !== 1
    ? `${BASE_URL}pustaka/page/${page}/?orderby=views`
    : `${BASE_URL}pustaka/?orderby=views`;

  let $;
  let result: Comic[] = [];
  try {
    $ = await fetchHTML(url);
    result = parseComicCards($);
  } catch {
    // silently fail
  }
  
  if (result.length === 0) {
    $ = await fetchHTML(BASE_URL);
    result = parseComicCards($);
    // Shuffle or slice
    result = result.slice(10, 20);
  }

  setCache(cacheKey, result);
  return result;
}

export async function getNewestManga(page: number): Promise<Comic[]> {
  const cacheKey = `newest_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  const url = page !== 1
    ? `${BASE_URL}page/${page}/`
    : `${BASE_URL}`; // komiku newest is on homepage

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result);
  return result;
}

export async function getByGenre(endpoint: string, page: number): Promise<Comic[]> {
  const cacheKey = `genre_${endpoint}_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  const url = page !== 1
    ? `${BASE_URL}genre/${endpoint}/page/${page}/`
    : `${BASE_URL}genre/${endpoint}/`;

  let $;
  try {
    $ = await fetchHTML(url);
  } catch {
    $ = await fetchHTML(BASE_URL);
  }
  const result = parseComicCards($);
  setCache(cacheKey, result);
  return result;
}

// ====== CHAPTER QUERIES ======

export async function getListChapter(endpoint: string): Promise<Chapter[]> {
  const cacheKey = `chapter_list_${endpoint}`;
  const cached = getCache<Chapter[]>(cacheKey);
  if (cached) return cached;

  let safeEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  if (!safeEndpoint.endsWith('/')) safeEndpoint += '/';
  const url = BASE_URL + 'manga' + safeEndpoint;
  const $ = await fetchHTML(url);
  const chapters: Chapter[] = [];

  $('#Chapter_List_Items li, .lchx, #Daftar_Chapter td.judulseries').each((_, el) => {
    const a = $(el).find('a');
    if (a.length > 0) {
      let chapterEndpoint = a.attr('href') || '';
      chapterEndpoint = chapterEndpoint.replace(BASE_URL, '');
      if (!chapterEndpoint.startsWith('/')) chapterEndpoint = '/' + chapterEndpoint;
      
      let date = $(el).find('.tanggalseries, .dt').text().trim();
      if (!date) date = $(el).next('.tanggalseries, .dt').text().trim();
      
      chapters.push({
        name: a.text().trim(),
        endpoint: chapterEndpoint,
        date: date || '-'
      });
    }
  });

  setCache(cacheKey, chapters, 10 * 60 * 1000);
  return chapters;
}

export async function getChapterDetail(endpoint: string): Promise<ChapterDetail> {
  const cacheKey = `chapter_detail_${endpoint}`;
  const cached = getCache<ChapterDetail>(cacheKey);
  if (cached) return cached;

  let safeEndpoint = endpoint.replace(/^\//, '');
  if (!safeEndpoint.endsWith('/')) safeEndpoint += '/';
  const url = BASE_URL + safeEndpoint;
  const $ = await fetchHTML(url);

  const images: string[] = [];
  $('#Baca_Komik img, .reader-area img, #chimg-auh img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && !src.includes('lazy')) images.push(src);
  });

  const title = $('.mk-chapter__title, .chapter-title, h1').first().text().trim();

  let next_chapter: string | undefined;
  let prev_chapter: string | undefined;

  $('a:contains("Next"), a:contains("Next Chapter"), a.nx').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !next_chapter && !href.includes('#')) {
      let ep = href.startsWith('http') ? href.replace(BASE_URL, '') : href;
      ep = ep.replace(/^\//, '');
      if (ep) next_chapter = '/' + ep;
    }
  });

  $('a:contains("Prev"), a:contains("Prev Chapter"), a.pr').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !prev_chapter && !href.includes('#')) {
      let ep = href.startsWith('http') ? href.replace(BASE_URL, '') : href;
      ep = ep.replace(/^\//, '');
      if (ep) prev_chapter = '/' + ep;
    }
  });

  const detail: ChapterDetail = { title, image: images, next_chapter, prev_chapter };
  setCache(cacheKey, detail, 30 * 60 * 1000); 
  return detail;
}
