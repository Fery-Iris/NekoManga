import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { apiSuccess, apiError } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const comicEndpoint = searchParams.get('endpoint');

    if (!comicEndpoint) {
      return apiError('Missing comic endpoint', 400);
    }

    const comments = await prisma.comment.findMany({
      where: {
        comicEndpoint,
        parentId: null, // Only fetch top-level comments
      },
      include: {
        user: {
          select: { name: true, avatar: true, image: true }
        },
        replies: {
          include: {
            user: { select: { name: true, avatar: true, image: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return apiSuccess(comments, 'Get comments success');
  } catch (error) {
    return apiError('Failed to fetch comments', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    const body = await request.json();
    const { comicEndpoint, text, parentId } = body;

    if (!comicEndpoint || !text) {
      return apiError('Missing required fields', 400);
    }

    const comment = await prisma.comment.create({
      data: {
        comicEndpoint,
        text,
        userId: session.user.id as string,
        parentId: parentId || null
      },
      include: {
        user: { select: { name: true, avatar: true, image: true } }
      }
    });

    return apiSuccess(comment, 'Comment created');
  } catch (error) {
    return apiError('Failed to create comment', 500);
  }
}
