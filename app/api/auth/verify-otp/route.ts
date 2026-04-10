import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { getUser } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'el-space-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, type = 'auth' } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = verifyOTP(email, otp);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    // Get user info if they exist
    const { data: user } = await getUser(email);

    // Create a specific token based on type
    const payload = { 
      email, 
      userId: user?.id,
      elSpaceId: user?.el_space_id,
      type, 
      verified: true, 
      timestamp: Date.now() 
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: type === 'auth' ? '7d' : '15m' });

    const response = NextResponse.json(
      { 
        success: true, 
        message: result.message, 
        token,
        user,
        type 
      },
      { status: 200 }
    );

    if (type === 'auth') {
      response.cookies.set('el-space-auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
