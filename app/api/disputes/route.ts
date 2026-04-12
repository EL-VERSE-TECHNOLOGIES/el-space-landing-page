import { NextRequest, NextResponse } from 'next/server';
import {
  createDispute,
  getDispute,
  getDisputesByProject,
  getDisputesByUser,
  updateDisputeStatus,
  addDisputeEvidence,
  getDisputeEvidence,
  createMediationSession,
  getMediationSession,
  updateMediationSession,
  recordMediationOutcome,
  escalateDispute,
  resolveDispute,
} from '@/lib/supabase';
import { uploadProjectDeliverable } from '@/lib/s3';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const disputeId = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (action === 'evidence' && disputeId) {
      const { data, error } = await getDisputeEvidence(disputeId);
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (disputeId) {
      const { data, error } = await getDispute(disputeId);
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (projectId) {
      const { data, error } = await getDisputesByProject(projectId);
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (userId) {
      const { data, error } = await getDisputesByUser(userId);
      if (error) throw error;
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...payload } = body;

    switch (action) {
      case 'create':
        return await handleCreateDispute(payload);
      
      case 'addEvidence':
        return await handleAddEvidence(payload);
      
      case 'createMediation':
        return await handleCreateMediation(payload);
      
      case 'updateMediation':
        return await handleUpdateMediation(payload);
      
      case 'recordOutcome':
        return await handleRecordOutcome(payload);
      
      case 'escalate':
        return await handleEscalate(payload);
      
      case 'resolve':
        return await handleResolve(payload);
      
      case 'updateStatus':
        return await handleUpdateStatus(payload);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Dispute API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCreateDispute(payload: any) {
  try {
    const {
      projectId,
      plaintiffId,
      defendantId,
      title,
      description,
      category,
    } = payload;

    if (!projectId || !plaintiffId || !defendantId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await createDispute({
      project_id: projectId,
      plaintiff_id: plaintiffId,
      defendant_id: defendantId,
      title,
      description,
      category,
    });

    if (error) throw error;

    // Send notification emails
    await sendEmail({
      to: plaintiffId, // Should be email, need to fetch from DB
      subject: 'Dispute Filed',
      text: `A dispute has been filed for project ${projectId}. Please check your dashboard for details.`,
    });

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
  }
}

async function handleAddEvidence(payload: any) {
  try {
    const {
      disputeId,
      userId,
      evidence,
      attachment,
    } = payload;

    if (!disputeId || !userId || !evidence) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let attachmentUrl: string | undefined;

    // If attachment is provided, upload it
    if (attachment) {
      const file = Buffer.from(attachment, 'base64');
      const uploaded = await uploadProjectDeliverable(
        disputeId,
        disputeId,
        file,
        `evidence-${Date.now()}`,
        'application/octet-stream'
      );
      attachmentUrl = uploaded.url;
    }

    const { data, error } = await addDisputeEvidence(
      disputeId,
      userId,
      evidence,
      attachmentUrl
    );

    if (error) throw error;

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding evidence:', error);
    return NextResponse.json({ error: 'Failed to add evidence' }, { status: 500 });
  }
}

async function handleCreateMediation(payload: any) {
  try {
    const { disputeId, mediatorId } = payload;

    if (!disputeId || !mediatorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await createMediationSession(disputeId, mediatorId);

    if (error) throw error;

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating mediation session:', error);
    return NextResponse.json({ error: 'Failed to create mediation session' }, { status: 500 });
  }
}

async function handleUpdateMediation(payload: any) {
  try {
    const { sessionId, status, notes, scheduledDate } = payload;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;
    if (scheduledDate) updates.scheduled_date = scheduledDate;

    const { data, error } = await updateMediationSession(sessionId, updates);

    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Error updating mediation session:', error);
    return NextResponse.json({ error: 'Failed to update mediation session' }, { status: 500 });
  }
}

async function handleRecordOutcome(payload: any) {
  try {
    const { disputeId, outcome, compensationAmount, compensationTo } = payload;

    if (!disputeId || !outcome) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await recordMediationOutcome(disputeId, {
      outcome,
      compensation_amount: compensationAmount,
      compensation_to: compensationTo,
    });

    if (error) throw error;

    return NextResponse.json({ data, success: true }, { status: 201 });
  } catch (error) {
    console.error('Error recording mediation outcome:', error);
    return NextResponse.json({ error: 'Failed to record outcome' }, { status: 500 });
  }
}

async function handleEscalate(payload: any) {
  try {
    const { disputeId, reason } = payload;

    if (!disputeId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await escalateDispute(disputeId, reason);

    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Error escalating dispute:', error);
    return NextResponse.json({ error: 'Failed to escalate dispute' }, { status: 500 });
  }
}

async function handleResolve(payload: any) {
  try {
    const { disputeId, resolution, compensationAmount, compensationTo } = payload;

    if (!disputeId || !resolution) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await resolveDispute(
      disputeId,
      resolution,
      compensationAmount,
      compensationTo
    );

    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 });
  }
}

async function handleUpdateStatus(payload: any) {
  try {
    const { disputeId, status, resolution } = payload;

    if (!disputeId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await updateDisputeStatus(
      disputeId,
      status,
      resolution
    );

    if (error) throw error;

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Error updating dispute status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
