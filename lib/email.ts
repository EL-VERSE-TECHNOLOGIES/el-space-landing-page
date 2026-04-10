import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function replacePlaceholders(content: string, data: Record<string, any>) {
  let result = content;
  
  for (const key in data) {
    const value = data[key];
    if (typeof value === 'string' || typeof value === 'number') {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
  }
  
  return result;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@elspace.tech',
      to,
      subject,
      html: html || text,
      text: text || html,
    });
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    throw error;
  }
}

// Welcome Emails
export async function sendClientWelcomeEmail(email: string, data: any) {
  const subject = 'Welcome to EL SPACE - Your Freelancer Marketplace';
  const text = `
Welcome ${data.clientName}!

You're now part of EL SPACE, where you can find and hire top freelancers.

Get Started:
- Browse Freelancers: {{dashboardUrl}}/browse
- Post Your First Job: {{dashboardUrl}}/jobs/post
- Join Our Community: {{slackInviteUrl}}

Questions? We're here to help.
Best,
The EL SPACE Team
  `.trim();
  
  return sendEmail({ to: email, subject, text: replacePlaceholders(text, data) });
}

export async function sendFreelancerWelcomeEmail(email: string, data: any) {
  const subject = 'Welcome to EL SPACE - Start Earning';
  const text = `
Welcome ${data.freelancerName}!

You're now part of EL SPACE, where you can find exciting projects and earn great money.

Get Started:
- View Your Profile: {{profileUrl}}
- Browse Available Projects: {{dashboardUrl}}/jobs
- Complete ELITES Training: {{elitesUrl}}

Questions? We're here to help.
Best,
The EL SPACE Team
  `.trim();
  
  return sendEmail({ to: email, subject, text: replacePlaceholders(text, data) });
}

// OTP Email
export async function sendOTPEmail(email: string, otp: string, type: 'register' | 'login' | 'transfer' | 'withdrawal') {
  const subject = type === 'register' 
    ? 'Verify Your Email - EL SPACE'
    : 'Your OTP Code - EL SPACE';
  
  const text = `
Your verification code is: ${otp}

This code will expire in 15 minutes.

If you didn't request this, please ignore this email.

The EL SPACE Team
  `.trim();
  
  return sendEmail({ to: email, subject, text });
}

// Milestone Funded Email
export async function sendMilestoneFundedEmail(to: string, type: 'client' | 'freelancer', data: any) {
  const subject = type === 'client'
    ? `✅ Milestone Funded – "${data.projectTitle}"`
    : `💰 Milestone Funded – Start Working on "${data.projectTitle}"`;
  
  const baseText = type === 'client'
    ? `
Hi ${data.clientName},

Your milestone payment of $${data.milestoneAmount} for "${data.projectTitle}" has been funded and is now in escrow.

Freelancer: ${data.freelancerName}
Amount: $${data.milestoneAmount}
Platform Fee: $${data.platformFee}

Next Steps:
- Monitor progress in your Project Dashboard
- Receive daily standups on Slack
- Review and approve milestones

Dashboard: {{dashboardUrl}}
    `
    : `
Hi ${data.freelancerName},

Great news! ${data.clientName} has funded Milestone 1 for "${data.projectTitle}".

Amount: $${data.milestoneAmount}
Your Earnings (after 5% fee): $${data.yourEarnings}

You're now cleared to begin work!

Next Steps:
1. Join the Slack channel
2. Post your first standup tomorrow at 9 AM
3. Begin working on the deliverables

Dashboard: {{dashboardUrl}}
    `.trim();
  
  return sendEmail({ to, subject, text: replacePlaceholders(baseText, data) });
}

// Daily Standup Reminder
export async function sendDailyStandupReminderEmail(to: string, data: any) {
  const subject = `⏰ Daily Standup Reminder – "${data.projectTitle}"`;
  
  const text = `
Hi {{freelancerName}},

It's time for your daily standup on {{projectTitle}}.

Please post in your Slack channel:
1. What I shipped yesterday
2. What I'm shipping today
3. Any blockers

Slack: {{slackChannelUrl}}
Dashboard: {{dashboardUrl}}
  `.trim();
  
  return sendEmail({ to, subject, text: replacePlaceholders(text, data) });
}

// Payment Received
export async function sendPaymentReceivedEmail(to: string, data: any) {
  const subject = `💵 Payment Received – $${data.yourEarnings} for "${data.projectTitle}"`;
  
  const text = `
Hi {{freelancerName}},

Great work! {{clientName}} has approved and released payment for {{projectTitle}}.

Amount: ${{milestoneAmount}}
Your Earnings (after 5% fee): ${{yourEarnings}}
Available in your wallet

Withdraw Options:
- Instant (5% fee): {{instantWithdrawUrl}}
- Standard (3 business days, free): {{standardWithdrawUrl}}

Keep it up!
The EL SPACE Team
  `.trim();
  
  return sendEmail({ to, subject, text: replacePlaceholders(text, data) });
}

// Project Completion
export async function sendProjectCompleteWithReviewEmail(to: string, type: 'client' | 'freelancer', data: any) {
  const subject = type === 'client'
    ? `🎉 Project Complete – Leave a Review`
    : `🎉 Project Complete – Leave a Review`;
  
  const baseText = type === 'client'
    ? `
Hi {{clientName}},

Congratulations! "{{projectTitle}}" is complete.

All milestones have been approved. Time to share your feedback!

Rate {{freelancerName}}: {{reviewUrl}}

Your review helps our community and recognizes great work.
    `
    : `
Hi {{freelancerName}},

Congratulations on completing "{{projectTitle}}"!

All payment has been released to your wallet.

Rate {{clientName}}: {{reviewUrl}}

Your feedback helps other freelancers find great clients.
    `.trim();
  
  return sendEmail({ to, subject, text: replacePlaceholders(baseText, data) });
}

// Alias for backwards compatibility
export async function sendProjectCompletionEmail(to: string, type: 'client' | 'freelancer', data: any) {
  return sendProjectCompleteWithReviewEmail(to, type, data);
}

// Post-Match Notifications
export async function sendPostMatchEmail(to: string, type: 'client' | 'freelancer', data: any) {
  const subject = type === 'client'
    ? `🎯 Your Matches Are Ready for "{{projectTitle}}"`
    : `🎯 New Match – Client Interested in Your Profile`;
  
  const baseText = type === 'client'
    ? `
Hi {{clientName}},

We found {{matchCount}} vetted freelancers for "{{projectTitle}}"

Browse Matches: {{dashboardUrl}}
    `
    : `
Hi {{freelancerName}},

A client has been shown your profile for a new project!

Project: "{{projectTitle}}"
Budget: ${{budgetMin}} - ${{budgetMax}}

You don't need to take action now. We'll notify you if they want to interview.
    `.trim();
  
  return sendEmail({ to, subject, text: replacePlaceholders(baseText, data) });
}

export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('Email connection verified');
    return true;
  } catch (error) {
    console.error('Email connection failed:', error);
    return false;
  }
}
