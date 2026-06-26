import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ success: false, error: 'Endpoint is required' }, { status: 400 });
  }

  try {
    const reaction = await prisma.chapterReaction.findUnique({
      where: { chapterEndpoint: endpoint },
    });

    if (!reaction) {
      return NextResponse.json({
        success: true,
        data: { keren: 0, lucu: 0, suka: 0, terkejut: 0, marah: 0, sedih: 0 }
      });
    }

    return NextResponse.json({ success: true, data: reaction });
  } catch (error) {
    console.error('Failed to fetch reactions:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { endpoint, type, action } = await request.json();
    
    if (!endpoint || !type || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
    }

    const validTypes = ['keren', 'lucu', 'suka', 'terkejut', 'marah', 'sedih'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid reaction type' }, { status: 400 });
    }

    const incrementValue = action === 'add' ? 1 : -1;

    // Use upsert to handle creation or update securely
    const updated = await prisma.chapterReaction.upsert({
      where: { chapterEndpoint: endpoint },
      create: {
        chapterEndpoint: endpoint,
        [type]: incrementValue > 0 ? 1 : 0,
      },
      update: {
        [type]: {
          increment: incrementValue
        }
      }
    });

    // Validasi agar tidak bernilai minus jika ada race condition saat 'remove' tanpa data valid
    if (updated[type as keyof typeof updated] < 0) {
      await prisma.chapterReaction.update({
        where: { chapterEndpoint: endpoint },
        data: { [type]: 0 }
      });
      updated[type as keyof typeof updated] = 0 as never;
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update reaction:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
