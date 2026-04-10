// In-memory store for OTPs (use Redis in production)
interface OTPData {
  code: string;
  expiresAt: number;
  attempts: number;
  type: 'register' | 'login' | 'transfer' | 'withdrawal';
  metadata?: Record<string, any>;
}

const otpStore: Map<string, OTPData> = new Map();

export function generateOTP(length: number = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

export function storeOTP(
  email: string,
  otp: string,
  expirySeconds: number = 900,
  type: 'register' | 'login' | 'transfer' | 'withdrawal' = 'login',
  metadata?: Record<string, any>
): void {
  otpStore.set(email, {
    code: otp,
    expiresAt: Date.now() + expirySeconds * 1000,
    attempts: 0,
    type,
    metadata,
  });
}

export function verifyOTP(email: string, otp: string): { valid: boolean; message: string; type?: string; metadata?: Record<string, any> } {
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

  // OTP is valid - don't delete yet, let the caller decide when to delete
  const result = {
    valid: true,
    message: 'OTP verified successfully.',
    type: storedOTP.type,
    metadata: storedOTP.metadata,
  };

  // Delete the OTP after successful verification
  otpStore.delete(email);

  return result;
}

export function deleteOTP(email: string): void {
  otpStore.delete(email);
}

export function getOTPAttempts(email: string): number {
  const storedOTP = otpStore.get(email);
  return storedOTP ? storedOTP.attempts : 0;
}

export function getOTPType(email: string): string | undefined {
  const storedOTP = otpStore.get(email);
  return storedOTP?.type;
}
