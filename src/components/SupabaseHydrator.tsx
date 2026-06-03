"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hydrateFromSupabase } from "@/lib/storage";

export default function SupabaseHydrator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      hydrateFromSupabase();
    }
  }, [user, loading]);

  return null;
}
