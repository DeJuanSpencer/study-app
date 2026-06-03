"use client";

import { useEffect } from "react";
import { hydrateFromSupabase } from "@/lib/storage";

export default function SupabaseHydrator() {
  useEffect(() => {
    hydrateFromSupabase();
  }, []);

  return null;
}
