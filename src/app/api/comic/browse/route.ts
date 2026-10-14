import { NextRequest } from 'next/server';
import { getComicByLetter, advancedFilterManga } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const letter = searchParams.get('huruf') || '';
    const tipe = searchParams.get('tipe') || '';
    const pageStr = searchParams.get('page') || '1';
    const page = parseInt(pageStr, 10) || 1;

    const orderby = searchParams.get('orderby') || '';
    const genre = searchParams.get('genre') || '';
    const status = searchParams.get('status') || '';

    const data = await advancedFilterManga(orderby, tipe, genre, status, page, letter);

    if (!data || data.length === 0) {
      return apiError('Data not found');
    }

    return apiSuccess(data, 'Get Browse Manga');
  } catch (error) {
    return apiError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 500);
  }
}
