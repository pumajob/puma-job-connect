import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useReferralTracking = () => {
  useEffect(() => {
    const trackReferral = async () => {
      // Get referral code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      
      if (!referralCode) return;
      
      // Store referral code in session storage for use after signup
      sessionStorage.setItem('referral_code', referralCode);
      
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is logged in, track referral immediately
        await processReferral(session.user.id, referralCode);
      }
    };
    
    trackReferral();
  }, []);
};

// Function to process referral after signup
export const processReferral = async (userId: string, referralCode?: string) => {
  try {
    // Get referral code from session storage if not provided
    const code = referralCode || sessionStorage.getItem('referral_code');
    
    if (!code) return;
    
    // Get user's IP address (approximate)
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipResponse.json();
    
    // Track the referral
    const { data, error } = await supabase.functions.invoke('track-referral', {
      body: {
        referralCode: code,
        userId: userId,
        userIp: ip
      }
    });
    
    if (error) {
      console.error('Error tracking referral:', error);
    } else {
      console.log('Referral tracked:', data);
      // Clear the referral code from storage
      sessionStorage.removeItem('referral_code');
    }
  } catch (error) {
    console.error('Error processing referral:', error);
  }
};
