import * as cheerio from 'cheerio';

function toTranslateGoogUrl(url) {
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

async function fetchHTML(url) {
  const fetchHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  };

  console.log('fetchHTML url:', url);
  const googUrl = toTranslateGoogUrl(url);
  console.log('googUrl:', googUrl);

  const res = await fetch(googUrl, {
    headers: fetchHeaders,
    signal: AbortSignal.timeout(6000),
  });
  console.log('goog res status:', res.status);
  const html = await res.text();
  console.log('html len:', html.length);
  return cheerio.load(html);
}

async function testComicInfo(slug) {
  const safeSlug = slug.replace(/^\/+|\/+$/g, '').replace(/^manga\//, '');
  const url = `https://komiku.org/manga/${safeSlug}/`;
  const $ = await fetchHTML(url);

  const title = $('#Judul h1, .manga-info h1, h1').first().text().trim();
  const synopsis = $('#Sinopsis p, .desc p, .sinopsis p, section#Sinopsis p, .komik_info-description-sinopsis p').text().trim();
  console.log('Title found:', title);
  console.log('Synopsis found:', synopsis);

  const chapters = [];
  $('#Chapter_List_Items li, .lchx, #Daftar_Chapter td.judulseries').each((_, el) => {
    const a = $(el).find('a');
    if (a.length > 0) {
      let date = $(el).find('.tanggalseries, .dt').text().trim();
      if (!date) date = $(el).next('.tanggalseries, .dt').text().trim();
      chapters.push({
        name: a.text().trim(),
        href: a.attr('href'),
        date: date
      });
    }
  });

  console.log('Chapters found count:', chapters.length);
  console.log('Sample chapter 0:', chapters[0]);
  console.log('Sample chapter 1:', chapters[1]);
}

testComicInfo('magic-emperor');
