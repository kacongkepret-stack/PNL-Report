import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const contentType = 'image/svg+xml';

export function GET() {
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#bgGradient)" />
      <path d="M22 8H12C10.8954 8 10 8.89543 10 10V24H14V18H20V24H24V10C24 8.89543 23.1046 8 22 8Z" fill="white" fillRule="evenodd" />
      <rect x="10" y="22" width="14" height="2" rx="1" fill="#0ea5e9" opacity="0.3" />
      <defs>
        <linearGradient id="bgGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}