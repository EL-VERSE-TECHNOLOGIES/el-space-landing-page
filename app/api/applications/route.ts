import { NextRequest, NextResponse } from 'next/server';
import { createApplication, getApplicationsByProject, getApplicationsByFreelancer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { freelancerId, projectId, coverLetter, rate, estimatedDays } = await request.json();

    if (!freelancerId || !projectId || !coverLetter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appData = {
      freelancer_id: freelancerId,
      project_id: projectId,
      cover_letter: coverLetter,
      proposed_rate: rate,
      estimated_days: estimatedDays,
      status: 'pending' as const,
    };

    const { data, error } = await createApplication(appData);

    if (error) throw error;

    return NextResponse.json({ success: true, application: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    const freelancerId = request.nextUrl.searchParams.get('freelancerId');

    if (projectId) {
      const { data, error } = await getApplicationsByProject(projectId);
      if (error) throw error;
      return NextResponse.json({ applications: data });
    }

    if (freelancerId) {
      const { data, error } = await getApplicationsByFreelancer(freelancerId);
      if (error) throw error;
      return NextResponse.json({ applications: data });
    }

    return NextResponse.json({ error: 'projectId or freelancerId required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
