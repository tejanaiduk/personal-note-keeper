import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

/** Client-only check for an existing session; `null` while unknown. */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    return () => {
      active = false;
    };
  }, []);
  return signedIn;
}
