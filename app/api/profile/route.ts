import { NextRequest, NextResponse } from 'next/server';
import { getUser, updateFreelancerProfile, deleteUser } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { data, error } = await getUser(userId);

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: data });
  } catch (error: unknown) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (body.isFreelancer) {
      const { data, error } = await updateFreelancerProfile(userId, {
        skills: body.skills,
        hourly_rate: body.hourlyRate,
        bio: body.bio,
        portfolio_url: body.portfolioUrl,
        years_experience: body.yearsExperience,
      });

      if (error) throw error;
      return NextResponse.json({ success: true, user: data });
    }

    // Update client profile
    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { error } = await deleteUser(userId);
    if (error) throw error;

    const response = NextResponse.json({ success: true, message: 'Account deleted' });
    response.cookies.delete('el-space-auth');
    
    return response;
  } catch (error: unknown) {
    console.error('Error deleting profile:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
  }
}
