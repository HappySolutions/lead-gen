import { NextRequest, NextResponse } from 'next/server';
import { searchLeads } from '@/services/places';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const loc = searchParams.get('loc');

  if (!q || !loc) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const cacheKey = `${q.toLowerCase()}-${loc.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return NextResponse.json(cached.data);
  }

  try {
    const leads = await searchLeads(q, loc);
    cache.set(cacheKey, { data: leads, timestamp: Date.now() });
    
    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
