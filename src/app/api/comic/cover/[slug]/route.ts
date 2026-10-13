import { fetchRealCover } from '@/lib/scraper';
import { apiSuccess, apiError } from '@/lib/response';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cleanSlug = slug.replace(/^\/+|\/+$/g, '').replace(/^manga\//, '');
    const cover = await fetchRealCover(cleanSlug);
    if (!cover) {
      return apiError('Cover not found', 404);
    }
    return apiSuccess({ cover }, 'Cover found');
  } catch (error) {
    return apiError(`Error: ${error instanceof Error ? error.message : 'Unknown'}`, 500);
  }
}
