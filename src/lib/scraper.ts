// Scraper module - replaces Go Colly scraping with Cheerio
// Equivalent to manga_query_impl.go and chapter_query_impl.go

import * as cheerio from 'cheerio';
import { Comic, ComicInfo, Chapter, ChapterDetail, Genre } from './types';
import { getCache, setCache } from './cache';

const BASE_URL = process.env.BASE_URL || 'https://mangaku.top/';

async function fetchHTML(url: string): Promise<cheerio.CheerioAPI> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
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

  $('.mk-card').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    let endpoint = href.replace(BASE_URL, '');
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint;
    }

    const titleEl = $el.find('.mk-card__title').clone();
    titleEl.find('.mk-badge--tipe').remove();
    titleEl.find('.mk-badge').remove();
    
    let titleText = titleEl.text().replace(/\s+/g, ' ').trim();
    // Sometimes the type is just appended at the beginning without a specific class in some designs
    const typeText = $el.find('.mk-badge--tipe').text().trim();
    if (typeText && titleText.startsWith(typeText)) {
      titleText = titleText.substring(typeText.length).trim();
    }

    const comic: Comic = {
      title: titleText,
      image: $el.find('img').attr('src') || '',
      type: typeText,
      endpoint,
    };

    comics.push(comic);
  });

  return comics;
}

// ====== MANGA QUERIES ======

export async function getAllComic(filter: string): Promise<Comic[]> {
  const cacheKey = `all_comic_${filter}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  let url = filter
    ? `${BASE_URL}daftar-komik/?tipe=${filter}`
    : `${BASE_URL}daftar-komik/`;

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
    ? `${BASE_URL}daftar-komik/page/${page}/`
    : `${BASE_URL}daftar-komik/`;

  const params: string[] = [];
  if (letter) params.push(`huruf=${letter}`);
  if (tipe) params.push(`tipe=${tipe}`);
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

  const url = BASE_URL + endpoint;
  const $ = await fetchHTML(url);

  const comicInfo: ComicInfo = {
    title: $('.mk-series__title').text().trim(),
    thumbnail: $('.mk-series__cover img').attr('src') || '',
    type: $('.mk-series__eyebrow-tipe').text().trim(),
    author: '',
    status: $('.mk-series__eyebrow-link').text().trim(),
    rating: '',
    genre: [],
    synopsis: $('#Sinopsis .mk-prose').text().trim(),
    chapter_list: [],
  };

  // Stats & Rating
  $('.mk-series__stats li').each((_, el) => {
    const $el = $(el);
    const label = $el.find('span').text().trim().toLowerCase();
    const value = $el.find('strong').text().trim();
    
    if (label.includes('rating')) {
      comicInfo.rating = value;
    } else if (label.includes('author') || label.includes('pengarang')) {
      comicInfo.author = value;
    }
  });

  // Fallback for author if not found in stats
  if (!comicInfo.author) {
    comicInfo.author = $('.mk-series__author').text().trim() || 'Unknown';
  }

  // Genres
  $('.mk-series__genres a').each((_, el) => {
    comicInfo.genre.push($(el).text().trim());
  });

  // Chapter list
  $('ol#Chapter_List_Items li.mk-chapter-list__item').each((_, el) => {
    const $el = $(el);
    const chapterLink = $el.find('a').attr('href') || '';
    let chapterEndpoint = chapterLink.replace(BASE_URL, '');
    if (!chapterEndpoint.startsWith('/')) {
      chapterEndpoint = '/' + chapterEndpoint;
    }

    const chapter: Chapter = {
      name: $el.find('.mk-chapter-list__name').text().trim(),
      endpoint: chapterEndpoint,
      date: $el.find('.mk-chapter-list__date').text().trim() || $el.find('.date').text().trim() || '-',
    };
    comicInfo.chapter_list.push(chapter);
  });

  setCache(cacheKey, comicInfo, 10 * 60 * 1000); // 10 min cache for detail
  return comicInfo;
}

export async function searchManga(query: string, genre?: string): Promise<Comic[]> {
  const cacheKey = `search_${query}_${genre || 'all'}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  let url = `${BASE_URL}?s=${encodeURIComponent(query)}`;
  
  // Jika sumber asli menggunakan /komik/ untuk advanced filter
  if (genre) {
    url = `${BASE_URL}komik/?s=${encodeURIComponent(query)}&genre[]=${encodeURIComponent(genre)}`;
  }

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result, 3 * 60 * 1000); // 3 min for search
  return result;
}

export async function getAllGenre(): Promise<Genre[]> {
  const cacheKey = 'all_genres';
  const cached = getCache<Genre[]>(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}komik/`;
  const $ = await fetchHTML(url);
  const genres: Genre[] = [];

  $('select[name="genre[]"] option').each((_, el) => {
    const $el = $(el);
    const value = $el.attr('value');
    if (value) {
      genres.push({
        endpoint: value,
        title: $el.text().trim(),
      });
    }
  });

  // Jika tidak ditemukan di form, fallback ke tipe (Manga, Manhwa, Manhua)
  if (genres.length === 0) {
    $('.mk-popover__list a').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      if (href.includes('/tipe/')) {
        genres.push({
          endpoint: href.replace(`${BASE_URL}tipe/`, '').replace(/\//g, ''),
          title: $el.find('span').text().trim(),
        });
      }
    });
  }

  setCache(cacheKey, genres, 30 * 60 * 1000); // 30 min for genres
  return genres;
}

export async function getPopularManga(page: number): Promise<Comic[]> {
  const cacheKey = `popular_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  const url = page !== 1
    ? `${BASE_URL}other/hot/page/${page}/`
    : `${BASE_URL}other/hot/`;

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result);
  return result;
}

export async function getRecommendedManga(page: number): Promise<Comic[]> {
  const cacheKey = `recommended_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  const url = page !== 1
    ? `${BASE_URL}komik/page/${page}/?orderby=views`
    : `${BASE_URL}komik/?orderby=views`;

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result);
  return result;
}

export async function getNewestManga(page: number): Promise<Comic[]> {
  const cacheKey = `newest_${page}`;
  const cached = getCache<Comic[]>(cacheKey);
  if (cached) return cached;

  const url = page !== 1
    ? `${BASE_URL}komik/page/${page}/`
    : `${BASE_URL}komik/`;

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
    ? `${BASE_URL}tipe/${endpoint}/page/${page}/`
    : `${BASE_URL}tipe/${endpoint}/`;

  const $ = await fetchHTML(url);
  const result = parseComicCards($);

  setCache(cacheKey, result);
  return result;
}

// ====== CHAPTER QUERIES ======

export async function getListChapter(endpoint: string): Promise<Chapter[]> {
  const cacheKey = `chapter_list_${endpoint}`;
  const cached = getCache<Chapter[]>(cacheKey);
  if (cached) return cached;

  const url = BASE_URL + endpoint;
  const $ = await fetchHTML(url);
  const chapters: Chapter[] = [];

  $('ol#Chapter_List_Items li.mk-chapter-list__item').each((_, el) => {
    const $el = $(el);
    const chapterLink = $el.find('a').attr('href') || '';
    if (chapterLink) {
      let chapterEndpoint = chapterLink.replace(BASE_URL, '');
      if (!chapterEndpoint.startsWith('/')) {
        chapterEndpoint = '/' + chapterEndpoint;
      }
      chapters.push({
        name: $el.find('.mk-chapter-list__name').text().trim(),
        endpoint: chapterEndpoint,
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

  const url = BASE_URL + endpoint;
  const $ = await fetchHTML(url);

  const images: string[] = [];
  $('#Chapter_Reader img').each((_, el) => {
    const src = $(el).attr('src');
    if (src) images.push(src);
  });

  const title = $('.mk-chapter__title').first().text().trim();

  const detail: ChapterDetail = { title, image: images };
  setCache(cacheKey, detail, 30 * 60 * 1000); // 30 min for chapter images
  return detail;
}
