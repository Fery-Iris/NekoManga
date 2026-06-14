import { getChapterDetail } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const { endpoint } = await params;
    const fullEndpoint = endpoint.join('/');

    const data = await getChapterDetail(fullEndpoint);
    if (!data || !data.image || data.image.length === 0) {
      return apiError('Chapter not found');
    }

    return apiSuccess(data, 'Get Chapter Detail');
  } catch (error) {
    return apiError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 500);
  }
}
