import { supabase } from './supabase';

export interface OTPData {
  code: string;
  expiresAt: number;
  attempts: number;
  type: 'register' | 'login' | 'transfer' | 'withdrawal';
  metadata?: Record<string, any>;
}

// Fallback in-memory store for when Supabase is not available
const otpStore: Map<string, OTPData> = new Map();

export function generateOTP(length: number = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

export async function storeOTP(
  email: string,
  otp: string,
  expirySeconds: number = 900,
  type: 'register' | 'login' | 'transfer' | 'withdrawal' = 'login',
  metadata?: Record<string, any>
): Promise<void> {
  const expiresAt = new Date(Date.now() + expirySeconds * 1000);
  
  try {
    // Try to store in Supabase first
    await supabase
      .from('otp_sessions')
      .upsert([{
        email,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        type,
        metadata,
        created_at: new Date().toISOString()
      }], {
        onConflict: 'email'
      });
  } catch (error) {
    console.warn('Failed to store OTP in Supabase, using in-memory store:', error);
    // Fallback to in-memory store
    otpStore.set(email, {
      code: otp,
      expiresAt: Date.now() + expirySeconds * 1000,
      attempts: 0,
      type,
      metadata,
    });
  }
}

export async function verifyOTP(email: string, otp: string): Promise<{ valid: boolean; message: string; type?: string; metadata?: Record<string, any> }> {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('otp_sessions')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      // Check in-memory store as fallback
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

      otpStore.delete(email);
      return { 
        valid: true, 
        message: 'OTP verified successfully.', 
        type: storedOTP.type,
        metadata: storedOTP.metadata 
      };
    }

    // Verify with Supabase data
    const expiresAt = new Date(data.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await supabase.from('otp_sessions').delete().eq('email', email);
      return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (data.attempts >= 5) {
      await supabase.from('otp_sessions').delete().eq('email', email);
      return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
    }

    if (data.otp_code !== otp) {
      await supabase
        .from('otp_sessions')
        .update({ attempts: data.attempts + 1 })
        .eq('email', email);
      return { valid: false, message: `Invalid OTP. ${5 - data.attempts} attempts remaining.` };
    }

    // OTP is valid, delete it
    await supabase.from('otp_sessions').delete().eq('email', email);
    return { 
      valid: true, 
      message: 'OTP verified successfully.', 
      type: data.type,
      metadata: data.metadata 
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    // Fallback to in-memory
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
    return { 
      valid: true, 
      message: 'OTP verified successfully.', 
      type: storedOTP.type,
      metadata: storedOTP.metadata 
    };
  }
}

export async function deleteOTP(email: string): Promise<void> {
  try {
    await supabase.from('otp_sessions').delete().eq('email', email);
  } catch (error) {
    otpStore.delete(email);
  }
}

export async function getOTPAttempts(email: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('otp_sessions')
      .select('attempts')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      const storedOTP = otpStore.get(email);
      return storedOTP ? storedOTP.attempts : 0;
    }
    
    return data.attempts || 0;
  } catch (error) {
    const storedOTP = otpStore.get(email);
    return storedOTP ? storedOTP.attempts : 0;
  }
}

export async function getOTPType(email: string): Promise<string | undefined> {
  try {
    const { data, error } = await supabase
      .from('otp_sessions')
      .select('type')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      const storedOTP = otpStore.get(email);
      return storedOTP?.type;
    }
    
    return data.type;
  } catch (error) {
    const storedOTP = otpStore.get(email);
    return storedOTP?.type;
  }
}
