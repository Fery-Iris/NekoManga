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

export const fetchSearch = async (query: string) => {
  const res = await fetch(`/api/comic/search/${encodeURIComponent(query)}`);
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

export const fetchBrowse = async (letter: string = '', tipe: string = '', page: number = 1) => {
  const params = new URLSearchParams();
  if (letter) params.append('huruf', letter);
  if (tipe) params.append('tipe', tipe);
  if (page > 1) params.append('page', page.toString());
  const res = await fetch(`/api/comic/browse?${params.toString()}`);
  return res.json();
};
