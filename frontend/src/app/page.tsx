"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  User,
} from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, isAuthenticated, checkAuth, error, clearError } =
    useAuthStore();
  const router = useRouter();

  // Check if already authenticated; if so, redirect to chat
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ name, email, password });
      }
      router.push("/chat");
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div
      className="auth-wrapper"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background effects */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(108,92,231,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-scale-in"
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo & Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "var(--radius-lg)",
              background: "var(--gradient-1)",
              marginBottom: "16px",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <MessageCircle size={32} color="white" />
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginBottom: "8px",
              letterSpacing: "-0.5px",
            }}
          >
            <span className="gradient-text">Pulse</span> Chat
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
            }}
          >
            {isLogin
              ? "Welcome back! Sign in to continue"
              : "Create an account to get started"}
          </p>
        </div>

        {/* Auth Form */}
        <div
          className="glass auth-card"
          style={{
            padding: "32px",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div
                className="animate-fade-in"
                style={{ marginBottom: "16px" }}
              >
                <label
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: "500",
                    marginBottom: "6px",
                  }}
                >
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    id="auth-name"
                    type="text"
                    className="input-field"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    style={{ paddingLeft: "42px" }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: "500",
                  marginBottom: "6px",
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  id="auth-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: "42px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: "500",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingLeft: "42px", paddingRight: "42px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "0",
                    display: "flex",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="animate-fade-in"
                style={{
                  background: "rgba(255,71,87,0.1)",
                  border: "1px solid rgba(255,71,87,0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  color: "var(--danger)",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}

            <button
              id="auth-submit"
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "14px",
                fontSize: "15px",
              }}
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "14px",
              color: "var(--text-secondary)",
            }}
          >
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              id="auth-toggle"
              onClick={toggleMode}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
