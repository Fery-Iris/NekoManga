import { NextRequest } from 'next/server';
import { getAllComic } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const filter = request.nextUrl.searchParams.get('filter') || '';

    const data = await getAllComic(filter);
    if (!data || data.length === 0) {
      return apiError('Data not found');
    }

    return apiSuccess(data, 'Get All Comic');
  } catch (error) {
    return apiError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 500);
  }
}
