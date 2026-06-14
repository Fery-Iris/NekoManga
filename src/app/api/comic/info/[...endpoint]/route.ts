import { getComicInfo } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const { endpoint } = await params;
    // Reconstruct the endpoint path from catch-all segments
    const fullEndpoint = endpoint.join('/');

    const data = await getComicInfo(fullEndpoint);
    if (!data || !data.title) {
      return apiError('Comic not found');
    }

    return apiSuccess(data, 'Get Comic Info');
  } catch (error) {
    return apiError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 500);
  }
}
