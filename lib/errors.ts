import { NextResponse } from 'next/server';

export class ApiError extends Error {
  status: number;
  retryAfter?: number;
  extra?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    retryAfter?: number,
    extra?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
    this.extra = extra;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    const headers = error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : undefined;
    return NextResponse.json(
      { error: error.message, ...error.extra },
      { status: error.status, headers },
    );
  }
  throw error;
}