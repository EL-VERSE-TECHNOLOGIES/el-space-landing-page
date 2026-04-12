import { NextResponse } from 'next/server';
import { getAllUsers, getAllPayments, getAllJobs } from '@/lib/supabase';

interface Payment {
  amount?: number;
  status?: string;
}

interface Job {
  status?: string;
}

export async function GET() {
  try {
    const users = await getAllUsers();
    const payments = await getAllPayments();
    const jobs = await getAllJobs();

    const stats = {
      totalUsers: users?.length || 0,
      totalPayments: payments?.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0) || 0,
      pendingPayments: payments?.filter((p: Payment) => p.status === 'pending').length || 0,
      totalJobListings: jobs?.length || 0,
      pendingApprovals: jobs?.filter((j: Job) => j.status === 'pending').length || 0,
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
