import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/db/helpers";
import { count, eq } from "drizzle-orm";

interface DebugInfo {
  env?: {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    DATABASE_URL: string;
    NODE_ENV: string | undefined;
  };
  cookies?: {
    raw: string;
    hasSbToken: boolean;
  };
  auth?: {
    user: {
      id: string;
      email: string | undefined;
      metadata_name: string | undefined;
    } | null;
    error: string | null;
  };
  database?: {
    connected: boolean;
    total_transactions_all_users?: number;
    error?: string;
  };
  helperUserId?: string | null;
  userTxCount?: number;
  helperError?: string;
  globalError?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Simple security check
  if (secret !== "tya-debug-123") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const diagnostics: DebugInfo = {};

  try {
    // 1. Check environment variables
    diagnostics.env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV,
    };

    // 2. Read headers & cookies
    const cookieHeader = request.headers.get("cookie") || "";
    diagnostics.cookies = {
      raw: cookieHeader.substring(0, 100) + (cookieHeader.length > 100 ? "..." : ""),
      hasSbToken: cookieHeader.includes("sb-") || cookieHeader.includes("supabase"),
    };

    // 3. Supabase Auth state inside Server Route
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    diagnostics.auth = {
      user: user ? {
        id: user.id,
        email: user.email,
        metadata_name: user.user_metadata?.full_name,
      } : null,
      error: authError ? authError.message : null,
    };

    // 4. Test database connection
    try {
      const dbTest = await db.select({ value: count() }).from(transactions);
      diagnostics.database = {
        connected: true,
        total_transactions_all_users: dbTest[0]?.value ?? 0,
      };
    } catch (dbErr) {
      const err = dbErr as Error;
      diagnostics.database = {
        connected: false,
        error: err.message,
      };
    }

    // 5. Check getCurrentUserId result
    try {
      const helperUserId = await getCurrentUserId();
      diagnostics.helperUserId = helperUserId;

      if (helperUserId) {
        const userTxCount = await db
          .select({ value: count() })
          .from(transactions)
          .where(eq(transactions.userId, helperUserId));

        diagnostics.userTxCount = userTxCount[0]?.value ?? 0;
      }
    } catch (helperErr) {
      const err = helperErr as Error;
      diagnostics.helperError = err.message;
    }

  } catch (err) {
    const error = err as Error;
    diagnostics.globalError = error.message;
  }

  return NextResponse.json(diagnostics);
}


