import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify reCAPTCHA token with Google
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) {
      console.error('RECAPTCHA_SECRET_KEY not found in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    console.log('Secret key starts with:', recaptchaSecret.substring(0, 10) + '...');
    console.log('Secret key length:', recaptchaSecret.length);

    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const verificationResponse = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: recaptchaSecret,
        response: token,
      }),
    });

    const verificationResult = await verificationResponse.json();
    
    // Debug logging
    console.log('reCAPTCHA verification result:', verificationResult);
    console.log('Token received:', token);
    console.log('Secret key length:', recaptchaSecret?.length);

    if (!verificationResult.success) {
      console.error('reCAPTCHA verification failed:', verificationResult['error-codes']);
      console.error('Full verification result:', verificationResult);
      return NextResponse.json({ 
        error: 'reCAPTCHA verification failed',
        details: verificationResult['error-codes'],
        fullResult: verificationResult
      }, { status: 400 });
    }

    // Check if score meets threshold (for reCAPTCHA v3)
    // Note: reCAPTCHA v2 doesn't have a score, so we skip this check
    if (verificationResult.score && verificationResult.score < 0.5) {
      return NextResponse.json({ 
        error: 'reCAPTCHA score too low',
        score: verificationResult.score
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      score: verificationResult.score || 1.0
    });

  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
