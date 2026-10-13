import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // Clean and normalize URL
  if (url.includes('thumbnail.komiku.to')) {
    url = url.replace('thumbnail.komiku.to', 'thumbnail.komiku.org');
  }
  if (url.includes('translate.goog')) {
    url = url.replace(/https?:\/\/([a-z0-9-]+)\.translate\.goog/i, (_, host) => {
      return `https://${host.replace(/-/g, '.')}`;
    });
  }

  // If local/relative path, redirect to origin
  if (url.startsWith('/')) {
    return NextResponse.redirect(new URL(url, request.url));
  }

  // Redirect client browser directly to image CDN with 307.
  // The client's residential browser IP can load CDN images directly,
  // bypassing Cloudflare datacenter IP blocks (HTTP 403) completely.
  return NextResponse.redirect(url, {
    status: 307,
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
