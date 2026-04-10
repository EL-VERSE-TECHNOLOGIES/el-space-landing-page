import { NextRequest, NextResponse } from 'next/server';
import { generateOTP, storeOTP } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/email';

const VALID_TYPES = ['register', 'login', 'transfer', 'withdrawal'];

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP(6);
    storeOTP(email, otp, 900); // 15 minutes

    // Send email
    await sendOTPEmail(email, otp);

    return NextResponse.json(
      { success: true, message: `OTP for ${type} sent to your email` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
