import { getByGenre } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ endpoint: string; page: string }> }
) {
  try {
    const { endpoint, page } = await params;
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return apiError('Invalid page number', 400);
    }

    const data = await getByGenre(endpoint, pageNum);
    if (!data || data.length === 0) {
      return apiError('Data not found');
    }

    return apiSuccess(data, 'Get Comic By Genre');
  } catch (error) {
    return apiError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 500);
  }
}
