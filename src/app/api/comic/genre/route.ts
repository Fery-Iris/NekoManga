import { getAllGenre } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET() {
  try {
    const data = await getAllGenre();
    if (!data || data.length === 0) {
      return apiError('Data not found');
    }

    return apiSuccess(data, 'Get all genre');
  } catch (error) {
    return apiError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 500);
  }
}
