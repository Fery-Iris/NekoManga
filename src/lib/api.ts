// Frontend API client - calls Next.js API routes (relative URLs)
// NekoMa API client - fetches from Next.js API routes

export const fetchPopular = async (page: number = 1) => {
  const res = await fetch(`/api/comic/popular/${page}`);
  return res.json();
};

export const fetchRecommended = async (page: number = 1) => {
  const res = await fetch(`/api/comic/recommended/${page}`);
  return res.json();
};

export const fetchNewest = async (page: number = 1) => {
  const res = await fetch(`/api/comic/newest/${page}`);
  return res.json();
};

export const fetchSearch = async (query: string, genre?: string) => {
  let url = `/api/comic/search/${encodeURIComponent(query || ' ')}`;
  if (genre && genre !== 'Semua') {
    url += `?genre=${encodeURIComponent(genre)}`;
  }
  const res = await fetch(url);
  return res.json();
};

export const fetchGenres = async () => {
  const res = await fetch('/api/comic/genre');
  return res.json();
};

export const fetchComicInfo = async (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const res = await fetch(`/api/comic/info/${cleanEndpoint}`);
  return res.json();
};

export const fetchChapterDetail = async (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const res = await fetch(`/api/comic/chapter/${cleanEndpoint}`);
  return res.json();
};

export const fetchBrowse = async (paramsObj: { orderby?: string, tipe?: string, genre?: string, status?: string, page?: number } = {}) => {
  const params = new URLSearchParams();
  if (paramsObj.orderby) params.append('orderby', paramsObj.orderby);
  if (paramsObj.tipe) params.append('tipe', paramsObj.tipe);
  if (paramsObj.genre) params.append('genre', paramsObj.genre);
  if (paramsObj.status) params.append('status', paramsObj.status);
  if (paramsObj.page && paramsObj.page > 1) params.append('page', paramsObj.page.toString());
  
  const res = await fetch(`/api/comic/browse?${params.toString()}`);
  return res.json();
};
