import { createContext, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

export interface AppData {
  user: User | null;
}

export const AppDataContext = createContext<AppData>({ user: null });

export function AppDataProvider({
  data,
  children,
}: {
  data: AppData;
  children: ReactNode;
}) {
  return <AppDataContext value={data}>{children}</AppDataContext>;
}

