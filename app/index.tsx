import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase/client';
import { LandingPage } from '../lib/landing/landing-page';

export default function LandingRoute() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace('/(app)/watch');
      } else {
        setChecked(true);
      }
    });
  }, []);

  if (!checked) return null;

  return <LandingPage />;
}
