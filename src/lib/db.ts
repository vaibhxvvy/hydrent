import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

let prisma: PrismaClient | null = null;
let supabase: ReturnType<typeof createClient> | null = null;

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }
  return prisma;
}

export function getSupabaseServer() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(url, key, {
      db: { schema: "public" },
    }) as any;
  }
  return supabase as any;
}
