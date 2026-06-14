import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("GET Bookmark error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { comicEndpoint, comicName, comicThumbnail, comicType } = await req.json();

    if (!comicEndpoint || !comicName) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        comicEndpoint,
        comicName,
        comicThumbnail,
        comicType
      }
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Already bookmarked" }, { status: 400 });
    }
    console.error("POST Bookmark error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ message: "Endpoint required" }, { status: 400 });
    }

    // Find the unique bookmark to delete
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_comicEndpoint: {
          userId: session.user.id,
          comicEndpoint: endpoint
        }
      }
    });

    if (!bookmark) {
      return NextResponse.json({ message: "Bookmark not found" }, { status: 404 });
    }

    await prisma.bookmark.delete({
      where: { id: bookmark.id }
    });

    return NextResponse.json({ message: "Bookmark deleted" });
  } catch (error) {
    console.error("DELETE Bookmark error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
