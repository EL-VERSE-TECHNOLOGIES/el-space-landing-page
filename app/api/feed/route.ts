import { NextRequest, NextResponse } from 'next/server';
import { getProjectFeed } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    
    const { data: feed, error } = await getProjectFeed(limit);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, feed });
  } catch (error: any) {
    console.error('Error in feed API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
