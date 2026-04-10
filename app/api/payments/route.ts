import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, clientId, projectId, description } = await request.json();

    if (!amount || !clientId || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Stripe integration will be implemented here
    // For now, create payment record in database
    const paymentData = {
      client_id: clientId,
      project_id: projectId,
      amount,
      currency: currency || 'USD',
      status: 'pending' as const,
      description,
    };

    // TODO: Integrate with Stripe API to create PaymentIntent
    // const intent = await stripe.paymentIntents.create({
    //   amount: amount * 100,
    //   currency,
    //   metadata: { clientId, projectId }
    // });

    return NextResponse.json({
      success: true,
      payment: paymentData,
      // clientSecret: intent.client_secret
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    // TODO: Fetch payments for project from database
    return NextResponse.json({ payments: [] });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
