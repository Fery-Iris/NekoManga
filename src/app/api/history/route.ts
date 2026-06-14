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

    const history = await prisma.history.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("GET History error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { comicEndpoint, chapterName, chapterEndpoint } = await req.json();

    if (!comicEndpoint || !chapterName || !chapterEndpoint) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Upsert: Create if not exists, otherwise update
    const history = await prisma.history.upsert({
      where: {
        userId_comicEndpoint: {
          userId: session.user.id,
          comicEndpoint
        }
      },
      update: {
        chapterName,
        chapterEndpoint,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        comicEndpoint,
        chapterName,
        chapterEndpoint
      }
    });

    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error("POST History error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
