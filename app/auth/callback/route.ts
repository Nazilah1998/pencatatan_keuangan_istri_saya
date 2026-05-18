import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  // 1. Cek apakah sudah ada sesi aktif di cookie (mencegah error akibat double-fetch / prefetch dari browser)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isLocalEnv = process.env.NODE_ENV === "development";
  const forwardedHost = request.headers.get("x-forwarded-host");

  // Tentukan URL redirect yang aman (selalu gunakan HTTPS di production)
  let targetOrigin = origin;
  if (!isLocalEnv) {
    const host = forwardedHost || new URL(request.url).host;
    targetOrigin = `https://${host}`;
  }

  if (session) {
    console.log(
      "[AuthCallback] Active session already exists, redirecting directly.",
    );
    return NextResponse.redirect(`${targetOrigin}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${targetOrigin}${next}`);
    } else {
      console.error("[AuthCallback] Exchange code error:", error);

      // Jika terjadi error penukaran kode (misal karena code sudah hangus akibat double request),
      // kita cek sekali lagi apakah sesi sebenarnya berhasil terbentuk di request pertama.
      const {
        data: { session: finalSession },
      } = await supabase.auth.getSession();

      if (finalSession) {
        console.log("[AuthCallback] Session resolved on fallback check.");
        return NextResponse.redirect(`${targetOrigin}${next}`);
      }
    }
  }

  // Jika gagal total, arahkan ke halaman error dengan HTTPS aman di production
  return NextResponse.redirect(`${targetOrigin}/auth/auth-code-error`);
}
