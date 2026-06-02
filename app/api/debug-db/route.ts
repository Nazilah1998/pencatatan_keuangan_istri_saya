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
    DATABASE_URL?: string;
    DATABASE_URL_DETAILS?: string;
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
    name?: string;
    code?: string;
    severity?: string;
    detail?: string;
    cause?: Record<string, unknown> | null;
    stack?: string;
  };
  helperUserId?: string | null;
  userTxCount?: number;
  helperError?: {
    message: string;
    name: string;
    code?: string;
    cause?: Record<string, unknown> | null;
    stack?: string;
  };
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
    let databaseUrlDetails = "NOT SET";
    if (process.env.DATABASE_URL) {
      try {
        const parsedUrl = new URL(process.env.DATABASE_URL);
        databaseUrlDetails = `protocol: ${parsedUrl.protocol}, host: ${parsedUrl.hostname}, port: ${parsedUrl.port}, pathname: ${parsedUrl.pathname}, params: ${parsedUrl.search}`;
      } catch (err) {
        databaseUrlDetails = "INVALID URL FORMAT: " + (err as Error).message;
      }
    }

    diagnostics.env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "SET"
        : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "SET"
        : "MISSING",
      DATABASE_URL_DETAILS: databaseUrlDetails,
      NODE_ENV: process.env.NODE_ENV,
    };

    // 2. Read headers & cookies
    const cookieHeader = request.headers.get("cookie") || "";
    diagnostics.cookies = {
      raw:
        cookieHeader.substring(0, 100) +
        (cookieHeader.length > 100 ? "..." : ""),
      hasSbToken:
        cookieHeader.includes("sb-") || cookieHeader.includes("supabase"),
    };

    // 3. Supabase Auth state inside Server Route
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    diagnostics.auth = {
      user: user
        ? {
            id: user.id,
            email: user.email,
            metadata_name: user.user_metadata?.full_name,
          }
        : null,
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
      const err = dbErr as Error & {
        code?: string;
        severity?: string;
        detail?: string;
        cause?: {
          message?: string;
          name?: string;
          code?: string;
          address?: string;
          port?: number;
          stack?: string;
        };
      };

      let causeDetails: Record<string, unknown> | null = null;
      if (err.cause) {
        causeDetails = {
          message: err.cause.message,
          name: err.cause.name,
          code: err.cause.code,
          address: err.cause.address,
          port: err.cause.port,
          stack: err.cause.stack,
        };
      }

      diagnostics.database = {
        connected: false,
        error: err.message,
        name: err.name,
        code: err.code,
        severity: err.severity,
        detail: err.detail,
        cause: causeDetails,
        stack: err.stack,
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
      const err = helperErr as Error & {
        code?: string;
        cause?: {
          message?: string;
          name?: string;
          code?: string;
          stack?: string;
        };
      };

      let causeDetails: Record<string, unknown> | null = null;
      if (err.cause) {
        causeDetails = {
          message: err.cause.message,
          name: err.cause.name,
          code: err.cause.code,
          stack: err.cause.stack,
        };
      }

      diagnostics.helperError = {
        message: err.message,
        name: err.name,
        code: err.code,
        cause: causeDetails,
        stack: err.stack,
      };
    }
  } catch (err) {
    const error = err as Error;
    diagnostics.globalError = error.message;
  }

  return NextResponse.json(diagnostics);
}
