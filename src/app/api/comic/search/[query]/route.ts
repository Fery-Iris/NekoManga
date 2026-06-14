import { searchManga } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params;
    const decodedQuery = decodeURIComponent(query);

    const data = await searchManga(decodedQuery);
    if (!data || data.length === 0) {
      return apiError('Data not found');
    }

    return apiSuccess(data, 'Search manga');
  } catch (error) {
    return apiError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 500);
  }
}
