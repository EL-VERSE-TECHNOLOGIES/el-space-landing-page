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

export async function sendOTPEmail(
  email: string,
  otp: string,
  userName?: string
) {
  try {
    const mailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_FROM,
      to: email,
      subject: `Your EL SPACE OTP: ${otp}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>EL SPACE - OTP Verification</title>
          </head>
          <body style="font-family: Inter, sans-serif; background-color: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1E1B4B; margin: 0;">
                  <span style="color: #06B6D4;">EL</span> SPACE
                </h1>
                <p style="color: #6B7280; margin: 5px 0; font-size: 14px;">Freelance Without the Friction</p>
              </div>
              
              <h2 style="color: #1F2937; margin-bottom: 20px;">Welcome${userName ? `, ${userName}` : ''}!</h2>
              
              <p style="color: #4B5563; line-height: 1.6; margin-bottom: 20px;">
                Your one-time password (OTP) to access your EL SPACE account is:
              </p>
              
              <div style="background-color: #f9fafb; border: 2px solid #06B6D4; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="font-size: 32px; font-weight: bold; color: #06B6D4; letter-spacing: 4px; margin: 0;">
                  ${otp}
                </p>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; margin: 20px 0;">
                This code will expire in 15 minutes. If you didn't request this code, please ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
                <p style="margin: 5px 0;">
                  © 2026 EL VERSE TECHNOLOGIES. All rights reserved.
                </p>
                <p style="margin: 5px 0;">
                  <a href="https://elspace.io" style="color: #06B6D4; text-decoration: none;">Visit EL SPACE</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(
  email: string,
  userName: string,
  userType: 'client' | 'freelancer'
) {
  try {
    const welcomeText = 
      userType === 'client'
        ? 'Start by posting your first project and find the perfect freelancer from our vetted talent pool.'
        : 'Complete your profile, get verified, and start receiving project opportunities.';

    const ctaText = userType === 'client' ? 'Post a Project' : 'Complete Profile';

    const mailOptions = {
      from: process.env.NEXT_PUBLIC_EMAIL_FROM,
      to: email,
      subject: `Welcome to EL SPACE, ${userName}! 🚀`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Welcome to EL SPACE</title>
          </head>
          <body style="font-family: Inter, sans-serif; background-color: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1E1B4B; margin: 0;">
                  <span style="color: #06B6D4;">EL</span> SPACE
                </h1>
              </div>
              
              <h2 style="color: #1F2937; margin-bottom: 20px;">Welcome to EL SPACE, ${userName}! 🚀</h2>
              
              <p style="color: #4B5563; line-height: 1.6; margin-bottom: 20px;">
                You've successfully joined ${userType === 'client' ? 'a community of forward-thinking businesses' : 'the top 5% of tech talent'}. 
              </p>
              
              <p style="color: #4B5563; line-height: 1.6; margin-bottom: 30px;">
                ${welcomeText}
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background-color: #F59E0B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  ${ctaText}
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <h3 style="color: #1F2937; margin-bottom: 15px;">What's Next?</h3>
              <ul style="color: #4B5563; line-height: 1.8;">
                ${userType === 'client' 
                  ? `
                    <li>📝 Post your first project</li>
                    <li>🔍 Browse vetted talent</li>
                    <li>💰 Get quality work at fair prices</li>
                  `
                  : `
                    <li>✅ Get verified (Portfolio → Test Project)</li>
                    <li>💼 Receive project matches</li>
                    <li>💵 Start earning from day one</li>
                  `
                }
              </ul>
              
              <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
                Questions? Check our <a href="https://elspace.io/help" style="color: #06B6D4;">Help Center</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
                <p style="margin: 5px 0;">
                  © 2026 EL VERSE TECHNOLOGIES. Freelance Without Friction.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
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
