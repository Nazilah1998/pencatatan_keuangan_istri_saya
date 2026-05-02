import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Sparkles, Wallet, TrendingUp, ShieldCheck } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <>
      <style>{`
        .login-bg {
          background: linear-gradient(135deg, #fff5f7 0%, #ffe0e6 100%);
          position: relative;
          overflow: hidden;
        }
        
        .blob {
          position: absolute;
          filter: blur(60px);
          z-index: 1;
          opacity: 0.6;
          animation: float 10s ease-in-out infinite alternate;
        }

        .blob-1 {
          top: -10%;
          left: -10%;
          width: 300px;
          height: 300px;
          background: #ff85a2;
          border-radius: 50%;
        }

        .blob-2 {
          bottom: -10%;
          right: -10%;
          width: 350px;
          height: 350px;
          background: #f7d1d9;
          border-radius: 50%;
          animation-delay: -5s;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 50px) scale(1.1); }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 1.5rem;
          box-shadow: 0 20px 40px rgba(255, 133, 162, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
          position: relative;
          z-index: 10;
          animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }

        @keyframes slideUpFade {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo-container {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #ff85a2 0%, #ff6b8e 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 24px rgba(255, 107, 142, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3);
          position: relative;
          margin: 0 auto;
          transform: rotate(-5deg);
          transition: transform 0.3s ease;
        }
        
        .logo-container:hover {
          transform: rotate(0deg) scale(1.05);
        }

        .sparkle-icon {
          position: absolute;
          top: -6px;
          right: -6px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .feature-icon-wrapper {
          width: 40px;
          height: 40px;
          background: var(--color-primary-highlight);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
        }

        .btn-google {
          width: 100%;
          min-height: 54px;
          font-size: 1.0625rem;
          font-weight: 600;
          background: white !important;
          color: #4a3a3d !important;
          border: 1px solid var(--color-border) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
          border-radius: 14px !important;
          transition: all 0.2s ease !important;
        }

        .btn-google:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08) !important;
          border-color: #ff85a2 !important;
        }
      `}</style>

      <div
        className="login-bg"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          padding: "1.5rem",
        }}
      >
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <div
          className="glass-card"
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "3rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            <div className="logo-container">
              <Wallet size={36} color="white" strokeWidth={2.5} />
              <Sparkles
                className="sparkle-icon"
                size={20}
                color="#ffe0e6"
                fill="#ffe0e6"
              />
            </div>

            <div>
              <h1
                style={{
                  fontSize: "1.875rem",
                  fontWeight: 800,
                  color: "var(--color-text)",
                  letterSpacing: "-0.03em",
                  marginBottom: "0.5rem",
                }}
              >
                Tyaaa Financee
              </h1>
              <p
                style={{
                  color: "var(--color-text-muted)",
                  lineHeight: 1.6,
                  fontSize: "0.9375rem",
                  padding: "0 0.5rem",
                }}
              >
                Catat pemasukan, atur pengeluaran, dan wujudkan target
                finansialmu dengan mudah dan elegan.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "1.5rem 0",
              borderTop: "1px solid rgba(255, 133, 162, 0.2)",
              borderBottom: "1px solid rgba(255, 133, 162, 0.2)",
            }}
          >
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <span>Tracker</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <span>G-Sheets</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </div>
              <span>Aman</span>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
              style={{ width: "100%" }}
            >
              <Button type="submit" size="md" className="btn-google">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  style={{ marginRight: "0.75rem" }}
                >
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Masuk dengan Google
              </Button>
            </form>

            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-faint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
              }}
            >
              <ShieldCheck size={14} /> Data Anda tersimpan aman dan
              terenkripsi.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
