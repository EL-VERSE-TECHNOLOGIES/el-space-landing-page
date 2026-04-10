import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

// In-memory user store (use database in production)
const users = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { email, name, userType } = await request.json();

    if (!email || !name || !userType) {
      return NextResponse.json(
        { error: 'Email, name, and user type are required' },
        { status: 400 }
      );
    }

    if (!['client', 'freelancer'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (users.has(email)) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = {
      email,
      name,
      userType,
      createdAt: new Date(),
      verified: true,
      profile: {
        bio: '',
        avatar: null,
        skills: [],
        portfolio: '',
        hourlyRate: null,
      },
    };

    users.set(email, user);

    // Send welcome email
    await sendWelcomeEmail(email, name, userType);

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Welcome email sent!',
        user: {
          email: user.email,
          name: user.name,
          userType: user.userType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in register:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
