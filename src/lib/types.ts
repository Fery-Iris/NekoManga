// Domain types - equivalent to Go domain models

export interface Comic {
  title: string;
  image: string;
  desc?: string;
  type?: string;
  endpoint: string;
}

export interface ComicInfo {
  thumbnail: string;
  title: string;
  type: string;
  author: string;
  status: string;
  rating: string;
  genre: string[];
  synopsis: string;
  chapter_list: Chapter[];
}

export interface Chapter {
  name: string;
  endpoint: string;
  date?: string;
}

export interface ChapterDetail {
  title: string;
  image: string[];
  next_chapter?: string;
  prev_chapter?: string;
}

export interface Genre {
  title: string;
  endpoint: string;
}

// API response wrapper - matches Go's BaseWrapperModel
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  code: number;
}
