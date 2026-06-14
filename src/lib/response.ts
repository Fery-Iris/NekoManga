// API response helpers - equivalent to Go's utils/wrapper.go
import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, message: string) {
  return NextResponse.json({
    success: true,
    data,
    message,
    code: 200,
  });
}

export function apiError(message: string, code: number = 404) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      message,
      code,
    },
    { status: code }
  );
}
