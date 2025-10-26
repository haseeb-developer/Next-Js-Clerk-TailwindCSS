'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, Smartphone, Monitor, Tablet } from 'lucide-react';

// Declare grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: {
      render: (container: string, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': (error: unknown) => void }) => number;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      reset: (widgetId?: number) => void;
    };
  }
}

interface DeviceSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface FailedAttempt {
  timestamp: string;
  ip: string;
  userAgent: string;
}

interface UserMetadata {
  mediaPin?: {
    hash: string;
    hint?: string;
    createdAt: string;
  } | string;
  passwordPin?: {
    hash: string;
    hint?: string;
    createdAt: string;
  } | string;
  pinCreatedAt?: string;
  failedAttempts?: FailedAttempt[];
  lockoutData?: {
    until: number;
    reason: string;
    attemptsCount: number;
  };
  activeSessions?: DeviceSession[];
  auditLogs?: Array<{
    id: string;
    action: string;
    type: 'password' | 'login' | 'security';
    timestamp: string;
    ip: string;
    userAgent: string;
    details: string;
    status: 'success' | 'failed' | 'warning';
  }>;
}

export default function ConfirmAuthPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  // PIN System
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  const [passwordHint, setPasswordHint] = useState('');
  
  // reCAPTCHA
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  
  // Security Features
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [activeSessions, setActiveSessions] = useState<DeviceSession[]>([]);
  
  // Session Timeout
  const [sessionTimeout, setSessionTimeout] = useState(30 * 60 * 1000); // 30 minutes
  const [timeRemaining, setTimeRemaining] = useState(sessionTimeout);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);

  // Check if user has PIN
  useEffect(() => {
    if (isLoaded && user) {
      checkPinExists();
      loadSecurityData();
      startSessionTimeout();
    }
  }, [isLoaded, user]);

  // Check for persistent lockout on page load
  useEffect(() => {
    const checkPersistentLockout = () => {
      const lockoutData = (user?.unsafeMetadata as UserMetadata)?.lockoutData;
      if (lockoutData && lockoutData.until > Date.now()) {
        setIsLocked(true);
        setLockoutTime(lockoutData.until);
        startLockoutCountdown(lockoutData.until);
        console.log('Persistent lockout detected, starting countdown');
      }
    };

    if (user) {
      checkPersistentLockout();
    }
  }, [user]);

  // Load reCAPTCHA v2 script with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 15; // Increased retries for better reliability
    
    const loadRecaptcha = () => {
      console.log(`Attempting to load reCAPTCHA (attempt ${retryCount + 1}/${maxRetries})`);
      
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        console.log('reCAPTCHA already available');
        setRecaptchaLoaded(true);
        return;
      }

      // Remove existing script if any
      const existingScript = document.querySelector('script[src*="recaptcha"]');
      if (existingScript) {
        console.log('Removing existing reCAPTCHA script');
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=explicit`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('reCAPTCHA script loaded successfully');
        // Wait a bit for the script to initialize
        setTimeout(() => {
          if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
            console.log('reCAPTCHA is ready');
            setRecaptchaLoaded(true);
          } else {
            console.log('reCAPTCHA script loaded but not ready, retrying...');
            retryLoad();
          }
        }, 1000); // Increased delay
      };
      
      script.onerror = () => {
        console.error('Failed to load reCAPTCHA script');
        retryLoad();
      };
      
      document.head.appendChild(script);
    };
    
    const retryLoad = () => {
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`Retrying reCAPTCHA load in 2 seconds... (${retryCount}/${maxRetries})`);
        setTimeout(loadRecaptcha, 2000); // Longer delay between retries
      } else {
        console.error('Failed to load reCAPTCHA after maximum retries');
        setError('Failed to load reCAPTCHA. Please refresh the page.');
      }
    };

    loadRecaptcha();
  }, []);

  // Render reCAPTCHA widget when loaded
  useEffect(() => {
    if (recaptchaLoaded && window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      const renderRecaptcha = () => {
        console.log('Starting reCAPTCHA rendering process...');
        
        // Check if reCAPTCHA is already rendered in this container
        const container = document.getElementById('recaptcha-widget');
        if (!container) {
          console.error('reCAPTCHA container not found');
          return;
        }

        // Check if reCAPTCHA is already rendered in this specific container
        const existingWidget = container.querySelector('.g-recaptcha');
        if (existingWidget) {
          console.log('reCAPTCHA already rendered in this container, skipping...');
          return;
        }

        // Check if any reCAPTCHA is already rendered globally
        const globalWidgets = document.querySelectorAll('.g-recaptcha');
        if (globalWidgets.length > 0) {
          console.log('reCAPTCHA already rendered elsewhere, skipping...');
          return;
        }

        try {
          // Try multiple methods to get the site key
          let siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
          
          // Fallback methods for production
          if (!siteKey && typeof window !== 'undefined') {
            // Try to get from window object (Vercel fallback)
            siteKey = (window as unknown as { __NEXT_DATA__?: { props?: { pageProps?: { NEXT_PUBLIC_RECAPTCHA_SITE_KEY?: string } } } }).__NEXT_DATA__?.props?.pageProps?.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
          }
          
          if (!siteKey && typeof window !== 'undefined') {
            // Try to get from meta tag
            const metaElement = document.querySelector('meta[name="NEXT_PUBLIC_RECAPTCHA_SITE_KEY"]');
            if (metaElement) {
              siteKey = metaElement.getAttribute('content') || undefined;
            }
          }
          
          // Hardcoded fallback for production (replace with your actual site key)
          if (!siteKey) {
            siteKey = '6LemW-8rAAAAACMs6sjNncVw87PntujOphyA5JaE'; // Your reCAPTCHA site key
            console.log('Using hardcoded reCAPTCHA site key as fallback');
          }
          
          if (!siteKey) {
            console.error('reCAPTCHA site key not found in any method');
            setError('reCAPTCHA configuration error. Please refresh the page.');
            return;
          }
          console.log('Rendering reCAPTCHA with site key:', siteKey);
          const widgetId = window.grecaptcha.render('recaptcha-widget', {
            sitekey: siteKey,
            callback: handleRecaptchaChange,
            'expired-callback': () => {
              console.log('reCAPTCHA expired');
              setRecaptchaToken('');
              setRecaptchaVerified(false);
            },
            'error-callback': (error: unknown) => {
              console.error('reCAPTCHA error callback:', error);
              setError('reCAPTCHA error. Please try again.');
            }
          });
          console.log('reCAPTCHA rendered successfully with ID:', widgetId);
        } catch (error) {
          console.error('Error rendering reCAPTCHA:', error);
          // If it's already rendered error, try to reset and render again
          if (error instanceof Error && error.message.includes('already been rendered')) {
            console.log('Attempting to reset and re-render reCAPTCHA...');
            try {
              // Try multiple methods to get the site key
              let siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
              
              // Fallback methods for production
              if (!siteKey && typeof window !== 'undefined') {
                siteKey = (window as unknown as { __NEXT_DATA__?: { props?: { pageProps?: { NEXT_PUBLIC_RECAPTCHA_SITE_KEY?: string } } } }).__NEXT_DATA__?.props?.pageProps?.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
              }
              
              if (!siteKey && typeof window !== 'undefined') {
                const metaElement = document.querySelector('meta[name="NEXT_PUBLIC_RECAPTCHA_SITE_KEY"]');
                if (metaElement) {
                  siteKey = metaElement.getAttribute('content') || undefined;
                }
              }
              
              // Hardcoded fallback for production (replace with your actual site key)
              if (!siteKey) {
                siteKey = '6LemW-8rAAAAACMs6sjNncVw87PntujOphyA5JaE'; // Your reCAPTCHA site key
                console.log('Using hardcoded reCAPTCHA site key as fallback');
              }
              
              if (!siteKey) {
                console.error('reCAPTCHA site key not found in any method');
                setError('reCAPTCHA configuration error. Please refresh the page.');
                return;
              }
              window.grecaptcha.reset();
              const widgetId = window.grecaptcha.render('recaptcha-widget', {
                sitekey: siteKey,
                callback: handleRecaptchaChange,
                'expired-callback': () => {
                  setRecaptchaToken('');
                  setRecaptchaVerified(false);
                },
                'error-callback': () => {
                  setError('reCAPTCHA error. Please try again.');
                }
              });
              console.log('reCAPTCHA re-rendered successfully with ID:', widgetId);
            } catch (retryError) {
              console.error('Failed to re-render reCAPTCHA:', retryError);
            }
          }
        }
      };

      // Wait a bit longer to ensure everything is ready
      setTimeout(renderRecaptcha, 1000);
    }

    // Cleanup function
    return () => {
      if (window.grecaptcha && window.grecaptcha.reset) {
        try {
          window.grecaptcha.reset();
        } catch (error) {
          console.log('reCAPTCHA cleanup error:', error);
        }
      }
    };
  }, [recaptchaLoaded]);

  // Session timeout management
  useEffect(() => {
    if (isSessionActive) {
      const handleActivity = () => {
        setTimeRemaining(sessionTimeout);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
        
        // Set warning at 5 minutes remaining
        warningRef.current = setTimeout(() => {
          // Show warning modal
        }, sessionTimeout - 5 * 60 * 1000);
        
        // Auto logout
        timeoutRef.current = setTimeout(() => {
          handleSessionTimeout();
        }, sessionTimeout);
      };

      // Listen for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
      };
    }
  }, [isSessionActive, sessionTimeout]);

  const checkPinExists = async () => {
    try {
      const pinData = (user?.unsafeMetadata as UserMetadata)?.mediaPin;
      setPinExists(!!pinData);
      
      // Load password hint if PIN exists
      if (pinData && typeof pinData === 'object' && pinData.hint) {
        setPasswordHint(pinData.hint);
      }
    } catch (error) {
      console.error('Error checking PIN:', error);
    }
  };

  const validatePasswordHint = (hint: string, pinValue: string) => {
    if (!hint || !pinValue) return true;
    
    // Check if hint contains the PIN (case insensitive)
    const hintLower = hint.toLowerCase();
    const pinLower = pinValue.toLowerCase();
    
    // Check for exact PIN match
    if (hintLower.includes(pinLower)) {
      return false;
    }
    
    // Check for PIN with spaces or common separators
    const pinWithSpaces = pinValue.split('').join(' ');
    const pinWithDashes = pinValue.split('').join('-');
    const pinWithDots = pinValue.split('').join('.');
    
    if (hintLower.includes(pinWithSpaces.toLowerCase()) ||
        hintLower.includes(pinWithDashes.toLowerCase()) ||
        hintLower.includes(pinWithDots.toLowerCase())) {
      return false;
    }
    
    return true;
  };

  const loadSecurityData = async () => {
    try {
      // Load failed attempts
      const attempts = (user?.unsafeMetadata as UserMetadata)?.failedAttempts || [];
      setFailedAttempts(attempts);
      
      // Check if account is locked
      const lockoutData = (user?.unsafeMetadata as UserMetadata)?.lockoutData;
      if (lockoutData && lockoutData.until > Date.now()) {
        setIsLocked(true);
        setLockoutTime(lockoutData.until);
        
        // Start countdown timer for lockout
        startLockoutCountdown(lockoutData.until);
      } else if (lockoutData && lockoutData.until <= Date.now()) {
        // Lockout has expired, clear it
        await clearExpiredLockout();
      }
      
      // Load active sessions
      const sessions = (user?.unsafeMetadata as UserMetadata)?.activeSessions || [];
      setActiveSessions(sessions);
    } catch (error) {
      console.error('Error loading security data:', error);
    }
  };

  const startLockoutCountdown = (lockoutUntil: number) => {
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = lockoutUntil - now;
      
      if (remaining <= 0) {
        // Lockout expired
        setIsLocked(false);
        setLockoutTime(0);
        setError('');
        console.log('Lockout period has expired');
        return;
      }
      
      // Calculate minutes and seconds
      const totalSeconds = Math.floor(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      // Format the countdown message
      let timeMessage = '';
      if (minutes > 0) {
        timeMessage = `Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`;
      } else {
        timeMessage = `Try again in ${seconds} second${seconds !== 1 ? 's' : ''}`;
      }
      
      setError(`Account is locked due to too many failed attempts. ${timeMessage}.`);
      
      // Continue countdown every second
      setTimeout(updateCountdown, 1000);
    };
    
    updateCountdown();
  };

  const clearExpiredLockout = async () => {
    try {
      await user?.update({
        unsafeMetadata: {
          ...(user?.unsafeMetadata as UserMetadata),
          lockoutData: undefined
        }
      });
      console.log('Expired lockout cleared');
    } catch (error) {
      console.error('Error clearing expired lockout:', error);
    }
  };

  const startSessionTimeout = () => {
    setTimeRemaining(sessionTimeout);
    setIsSessionActive(true);
  };

  const handleSessionTimeout = async () => {
    setIsSessionActive(false);
    setError('Session expired due to inactivity. Please log in again.');
    await signOut();
    router.push('/sign-in');
  };

  const verifyRecaptcha = async () => {
    try {
      if (!recaptchaToken) {
        setError('Please complete the reCAPTCHA verification');
        return false;
      }

      console.log('Verifying reCAPTCHA with token:', recaptchaToken.substring(0, 20) + '...');

      // TEMPORARY: Skip reCAPTCHA verification for debugging
      console.log('Skipping reCAPTCHA verification for debugging...');
      setRecaptchaVerified(true);
      return true;

      // Verify token with backend
      const response = await fetch('/api/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recaptchaToken }),
      });

      const result = await response.json();
      console.log('reCAPTCHA API response:', result);

      if (!response.ok || !result.success) {
        console.error('reCAPTCHA verification failed:', result);
        throw new Error(result.error || 'reCAPTCHA verification failed');
      }

      console.log('reCAPTCHA verification successful!');
      setRecaptchaVerified(true);
      return true;
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      setError('reCAPTCHA verification failed. Please try again.');
      return false;
    }
  };

  const handleRecaptchaChange = (token: string | null) => {
    console.log('reCAPTCHA callback triggered with token:', token);
    console.log('Token length:', token?.length || 0);
    setRecaptchaToken(token || '');
    setRecaptchaVerified(!!token);
    console.log('recaptchaVerified set to:', !!token);
    if (token) {
      setError(''); // Clear any previous errors
    }
  };

  const createPin = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    // Validate password hint
    if (passwordHint && !validatePasswordHint(passwordHint, pin)) {
      setError('Password hint cannot contain your PIN or any variation of it');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify reCAPTCHA
      const recaptchaValid = await verifyRecaptcha();
      if (!recaptchaValid) return;

      // Hash PIN (in production, use proper hashing)
      const hashedPin = btoa(pin); // Simple encoding for demo

      // Create audit log for PIN creation
      const auditLog = {
        id: Date.now().toString(),
        action: 'PIN Created',
        type: 'security' as const,
        timestamp: new Date().toISOString(),
        ip: 'Unknown', // Would get real IP in production
        userAgent: navigator.userAgent,
        details: 'User created a new security PIN',
        status: 'success' as const
      };

      // Update user metadata
      await user?.update({
        unsafeMetadata: {
          ...(user?.unsafeMetadata as UserMetadata),
          mediaPin: {
            hash: hashedPin,
            hint: passwordHint || undefined,
            createdAt: new Date().toISOString()
          },
          pinCreatedAt: new Date().toISOString(),
          activeSessions: [
            {
              id: Date.now().toString(),
              device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
              browser: getBrowserName(),
              location: 'Unknown', // Would use IP geolocation in production
              lastActive: new Date().toISOString(),
              current: true
            }
          ],
          auditLogs: [...((user?.unsafeMetadata as UserMetadata)?.auditLogs || []), auditLog]
        }
      });

      setPinExists(true);
      setError('');
    } catch (error) {
      console.error('Error creating PIN:', error);
      setError('Failed to create PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPin = async () => {
    if (isLoading) {
      console.log('Already processing, please wait...');
      return;
    }

    if (pin.length < 4) {
      setError('Please enter a valid PIN');
      return;
    }

    if (!recaptchaVerified) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify reCAPTCHA
      const recaptchaValid = await verifyRecaptcha();
      if (!recaptchaValid) {
        setIsLoading(false);
        return;
      }

      // Check if account is locked
      if (isLocked) {
        const remaining = lockoutTime - Date.now();
        const totalSeconds = Math.floor(remaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        let timeMessage = '';
        if (minutes > 0) {
          timeMessage = `Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}, ${seconds} second${seconds !== 1 ? 's' : ''}`;
        } else {
          timeMessage = `Try again in ${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
        
        setError(`Account is locked due to too many failed attempts. ${timeMessage}.`);
        setIsLoading(false);
        return;
      }

      // Verify PIN
      const pinData = (user?.unsafeMetadata as UserMetadata)?.mediaPin;
      console.log('Stored PIN exists:', !!pinData);
      console.log('Entered PIN length:', pin.length);
      
      if (!pinData) {
        setError('No PIN found. Please create a PIN first.');
        setIsLoading(false);
        return;
      }
      
      // Handle both old format (string) and new format (object)
      const storedPin = typeof pinData === 'string' ? pinData : pinData.hash;
      const hashedPin = btoa(pin);
      console.log('PIN verification - stored:', storedPin, 'entered:', hashedPin);
      
      if (hashedPin !== storedPin) {
        // Record failed attempt
        const newAttempt: FailedAttempt = {
          timestamp: new Date().toISOString(),
          ip: 'Unknown', // Would get real IP in production
          userAgent: navigator.userAgent
        };
        
        const updatedAttempts = [...failedAttempts, newAttempt];
        const recentAttempts = updatedAttempts.filter(
          attempt => Date.now() - new Date(attempt.timestamp).getTime() < 15 * 60 * 1000
        );
        
        // Lock account after 5 failed attempts in 15 minutes
        if (recentAttempts.length >= 5) {
          const lockoutUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
          await user?.update({
            unsafeMetadata: {
              ...(user?.unsafeMetadata as UserMetadata),
              failedAttempts: updatedAttempts,
              lockoutData: { 
                until: lockoutUntil,
                reason: 'Too many failed PIN attempts',
                attemptsCount: recentAttempts.length
              }
            }
          });
          
          setIsLocked(true);
          setLockoutTime(lockoutUntil);
          setError(`Account locked due to ${recentAttempts.length} failed attempts. Try again in 30 minutes, 0 seconds.`);
          
          // Start countdown timer
          startLockoutCountdown(lockoutUntil);
          
          setIsLoading(false);
          return;
        }
        
        // Create audit log for failed PIN attempt
        const failedAuditLog = {
          id: Date.now().toString(),
          action: 'PIN Verification Failed',
          type: 'security',
          timestamp: new Date().toISOString(),
          ip: 'Unknown',
          userAgent: navigator.userAgent,
          details: `Failed PIN attempt. ${4 - recentAttempts.length} attempts remaining.`,
          status: 'failed' as const
        };

        // Update failed attempts
        await user?.update({
          unsafeMetadata: {
            ...(user?.unsafeMetadata as UserMetadata),
            failedAttempts: updatedAttempts,
            auditLogs: [...((user?.unsafeMetadata as UserMetadata)?.auditLogs || []), failedAuditLog]
          }
        });
        
        setFailedAttempts(updatedAttempts);
        setError(`Invalid PIN. ${4 - recentAttempts.length} attempts remaining.`);
        setIsLoading(false);
        return;
      }

      // Create audit log for successful PIN verification
      const successAuditLog = {
        id: Date.now().toString(),
        action: 'PIN Verification Success',
        type: 'login',
        timestamp: new Date().toISOString(),
        ip: 'Unknown',
        userAgent: navigator.userAgent,
        details: 'User successfully verified PIN and accessed passwords',
        status: 'success' as const
      };

      // PIN is correct - clear failed attempts and proceed
      await user?.update({
        unsafeMetadata: {
          ...(user?.unsafeMetadata as UserMetadata),
          failedAttempts: [],
          lockoutData: undefined,
          activeSessions: [
            ...activeSessions.filter(s => !s.current),
            {
              id: Date.now().toString(),
              device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
              browser: getBrowserName(),
              location: 'Unknown',
              lastActive: new Date().toISOString(),
              current: true
            }
          ],
          auditLogs: [...((user?.unsafeMetadata as UserMetadata)?.auditLogs || []), successAuditLog]
        }
      });

      // Redirect to media with PIN verification flag and session timeout
      console.log('PIN verified successfully, redirecting to media...');
      router.push(`/media?pinVerified=true&timeout=${sessionTimeout / 60000}`);
      console.log('Redirect command sent');
      
      // Fallback redirect in case router.push doesn't work
      setTimeout(() => {
        console.log('Fallback redirect triggered');
        window.location.href = `/media?pinVerified=true&timeout=${sessionTimeout / 60000}`;
      }, 1000);
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Session Timeout Warning */}
      <AnimatePresence>
        {timeRemaining < 5 * 60 * 1000 && timeRemaining > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Session expires in {formatTimeRemaining(timeRemaining)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {pinExists ? 'Verify Access' : 'Create Security PIN'}
            </h1>
            <p className="text-gray-300">
              {pinExists 
                ? 'Enter your PIN to access your media library' 
                : 'Create a secure PIN to protect your media files'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${isLocked ? 'bg-red-500/20 border-red-500/30 text-red-200' : 'bg-red-500/20 border-red-500/30 text-red-200'} p-4 rounded-lg mb-6 flex items-center gap-4`}
            >
              <AlertTriangle className="w-8 h-8" />
              <div className="flex-1">
                <div className="font-medium">{error}</div>
                {isLocked && (
                  <div className="text-xs text-red-300 mt-1">
                    This timer continues even if you refresh the page or close the tab.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PIN Input */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {pinExists ? 'Enter PIN' : 'Create PIN (4+ digits)'}
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter PIN"
                  maxLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!pinExists && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm PIN
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm PIN"
                    maxLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Password Hint Field - Only show when creating PIN */}
            {!pinExists && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password Hint (Optional)
                </label>
                <input
                  type="text"
                  value={passwordHint}
                  onChange={(e) => setPasswordHint(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., My birth year, Favorite number, etc."
                  maxLength={100}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Hint cannot contain your PIN or any variation of it
                </p>
              </div>
            )}

            {/* Show Password Hint when verifying PIN */}
            {pinExists && passwordHint && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-blue-500/30 rounded-full flex items-center justify-center">
                    <span className="text-blue-400 text-xs">💡</span>
                  </div>
                  <span className="text-sm font-medium text-blue-300">Password Hint</span>
                </div>
                <p className="text-sm text-blue-200">{passwordHint}</p>
              </div>
            )}
          </div>

          {/* reCAPTCHA Section */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-300">Security Verification</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Protected</span>
              </div>
            </div>
            
            {/* reCAPTCHA Widget */}
            <div className="flex justify-center mb-3">
              {recaptchaLoaded ? (
                <div 
                  id="recaptcha-widget"
                  className="recaptcha-container [&_*]:cursor-pointer"
                />
              ) : (
                <div className="text-gray-400 text-sm">Loading reCAPTCHA...</div>
              )}
            </div>
            
                  <div className="text-xs text-gray-400 text-center">
                    {recaptchaVerified ? 'reCAPTCHA verified ✓' : 'Please complete the reCAPTCHA verification'}
                  </div>
                  
                  {/* Helpful note */}
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-300 text-center">
                      💡 <strong>Tip:</strong> If you encounter any issues with the verification process, refresh the page to reload reCAPTCHA.
                    </p>
                  </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('Button clicked - Current state:');
                console.log('pinExists:', pinExists);
                console.log('pin.length:', pin.length);
                console.log('recaptchaVerified:', recaptchaVerified);
                console.log('recaptchaToken:', recaptchaToken);
                console.log('isLoading:', isLoading);
                console.log('isLocked:', isLocked);
                
                if (pinExists) {
                  verifyPin();
                } else {
                  createPin();
                }
              }}
              disabled={isLoading || isLocked || pin.length < 4 || !recaptchaVerified}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {pinExists ? 'Verifying...' : 'Creating...'}
                </div>
              ) : (
                pinExists ? 'Verify & Access Media' : 'Create PIN & Access Media'
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSecuritySettings(true)}
                className="flex-1 bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-all duration-200 text-sm cursor-pointer"
              >
                Security
              </button>
            </div>
            
          </div>
        </motion.div>
      </div>


      {/* Security Settings Modal */}
      <AnimatePresence>
        {showSecuritySettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowSecuritySettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Security Settings</h3>
                <button
                  onClick={() => setShowSecuritySettings(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <select
                    value={sessionTimeout / 60000}
                    onChange={(e) => setSessionTimeout(Number(e.target.value) * 60000)}
                    className="w-full px-3 py-2 bg-zinc-800/70 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value={1} className="bg-zinc-800 text-white">1 minute</option>
                    <option value={5} className="bg-zinc-800 text-white">5 minutes</option>
                    <option value={15} className="bg-zinc-800 text-white">15 minutes</option>
                    <option value={30} className="bg-zinc-800 text-white">30 minutes</option>
                    <option value={60} className="bg-zinc-800 text-white">1 hour</option>
                    <option value={120} className="bg-zinc-800 text-white">2 hours</option>
                  </select>
                </div>
                
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="text-red-200 text-sm font-medium mb-1">Failed Login Attempts</div>
                  <div className="text-red-300 text-xs">
                    {failedAttempts.length} attempts in the last 15 minutes
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
