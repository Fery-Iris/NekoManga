import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url') || 'https://komiku-org.translate.goog/manga/magic-emperor/?_x_tr_sl=en&_x_tr_tl=id&_x_tr_hl=id&_x_tr_pto=wapp';

  const debug: any = { target };

  // 1. Test fetch to target
  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    debug.status = res.status;
    debug.headers = Object.fromEntries(res.headers.entries());
    const text = await res.text();
    debug.bodyLength = text.length;
    debug.bodySnippet = text.slice(0, 500);
  } catch (err: any) {
    debug.error = err.message;
  }

  // 2. Test direct to komiku.org
  try {
    const dRes = await fetch('https://komiku.org/manga/magic-emperor/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    debug.directStatus = dRes.status;
  } catch (err: any) {
    debug.directError = err.message;
  }

  return NextResponse.json(debug);
}
