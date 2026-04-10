// In-memory store for OTPs (use Redis in production)
const otpStore: Map<string, { code: string; expiresAt: number; attempts: number }> = new Map();

export function generateOTP(length: number = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

export function storeOTP(email: string, otp: string, expirySeconds: number = 900): void {
  otpStore.set(email, {
    code: otp,
    expiresAt: Date.now() + expirySeconds * 1000,
    attempts: 0,
  });
}

export function verifyOTP(email: string, otp: string): { valid: boolean; message: string } {
  const storedOTP = otpStore.get(email);

  if (!storedOTP) {
    return { valid: false, message: 'No OTP found. Please request a new one.' };
  }

  if (Date.now() > storedOTP.expiresAt) {
    otpStore.delete(email);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (storedOTP.attempts >= 5) {
    otpStore.delete(email);
    return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
  }

  if (storedOTP.code !== otp) {
    storedOTP.attempts++;
    return { valid: false, message: `Invalid OTP. ${5 - storedOTP.attempts} attempts remaining.` };
  }

  // OTP is valid, delete it
  otpStore.delete(email);
  return { valid: true, message: 'OTP verified successfully.' };
}

export function deleteOTP(email: string): void {
  otpStore.delete(email);
}

export function getOTPAttempts(email: string): number {
  const storedOTP = otpStore.get(email);
  return storedOTP ? storedOTP.attempts : 0;
}
