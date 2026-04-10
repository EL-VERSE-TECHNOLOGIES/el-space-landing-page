import { NextRequest, NextResponse } from 'next/server';
import { createMilestone, getMilestonesByProject } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { projectId, title, description, amount, dueDate } = await request.json();

    if (!projectId || !title || !amount || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const milestoneData = {
      project_id: projectId,
      title,
      description: description || '',
      amount,
      due_date: dueDate,
      status: 'pending' as const,
    };

    const { data, error } = await createMilestone(milestoneData);

    if (error) throw error;

    return NextResponse.json({ success: true, milestone: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const { data, error } = await getMilestonesByProject(projectId);

    if (error) throw error;

    return NextResponse.json({ milestones: data });
  } catch (error: any) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { milestoneId, status } = await request.json();

    if (!milestoneId || !['pending', 'submitted', 'approved', 'released'].includes(status)) {
      return NextResponse.json({ error: 'Invalid milestone ID or status' }, { status: 400 });
    }

    // TODO: Update milestone status in database
    return NextResponse.json({
      success: true,
      message: 'Milestone status updated',
      milestone: { id: milestoneId, status }
    });
  } catch (error: any) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
