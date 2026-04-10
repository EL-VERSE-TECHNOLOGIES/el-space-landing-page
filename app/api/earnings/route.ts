import { NextRequest, NextResponse } from 'next/server';
import { getFreelancerEarnings } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const freelancerId = request.nextUrl.searchParams.get('freelancerId');

    if (!freelancerId) {
      return NextResponse.json({ error: 'freelancerId required' }, { status: 400 });
    }

    const { data, error } = await getFreelancerEarnings(freelancerId);

    if (error) throw error;

    // Calculate earnings statistics
    const totalEarnings = data.reduce((sum: number, e: any) => sum + (e.total_amount || 0), 0);
    const completedProjects = data.filter((e: any) => e.status === 'completed').length;
    const pendingEarnings = data.reduce((sum: number, e: any) => {
      if (e.status === 'pending' || e.status === 'processing') return sum + (e.total_amount || 0);
      return sum;
    }, 0);

    return NextResponse.json({
      earnings: data,
      stats: {
        totalEarnings,
        completedProjects,
        pendingEarnings,
        averageProjectValue: completedProjects > 0 ? (totalEarnings / completedProjects).toFixed(2) : 0,
      }
    });
  } catch (error: any) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { freelancerId, amount, reason } = await request.json();

    if (!freelancerId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // TODO: Process withdrawal request
    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawal: {
        id: Math.random().toString(36).substr(2, 9),
        amount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
