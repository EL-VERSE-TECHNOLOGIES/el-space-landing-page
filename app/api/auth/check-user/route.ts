import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { data: user, error } = await getUser(email);

    if (error || !user) {
      return NextResponse.json(
        { exists: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        exists: true, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          user_type: user.user_type,
          el_space_id: user.el_space_id,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in check-user:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}
