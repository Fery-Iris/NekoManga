import { getRecommendedManga } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    const { page } = await params;
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return apiError('Invalid page number', 400);
    }

    const data = await getRecommendedManga(pageNum);
    return apiSuccess(data, 'Get Recommended Manga');
  } catch {
    const fallback = await getRecommendedManga(1);
    return apiSuccess(fallback, 'Get Recommended Manga (Fallback)');
  }
}
