"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { careerApi, setAccessToken } from "../services/apiClient";

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const update = (key, value) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const result =
        mode === "login"
          ? await careerApi.login({ email: form.email, password: form.password })
          : await careerApi.register(form);
      setAccessToken(result.access_token);
      onAuthenticated(result.user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể đăng nhập.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app auth-page">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <motion.div
        className="auth-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <section className="auth-story">
          <span className="brand-lockup auth-brand">
            <span className="brand-mark">V<Bot size={12} /></span>
            <span className="brand-copy">
              <strong>VinCareer <em>AI</em></strong>
              <span>Sinh viên edition</span>
            </span>
          </span>
          <span className="live-pill"><i className="live-dot" /> Career Intelligence Platform</span>
          <h1>Biến CV thành<br /><span>lộ trình nghề nghiệp.</span></h1>
          <p>
            Một tài khoản để khám phá công ty, phân tích CV, nhận Top 3 phù hợp
            và trò chuyện với AI có dữ liệu grounding.
          </p>
          <div className="auth-benefits">
            <span><CheckCircle2 size={15} /> Portfolio lưu riêng theo tài khoản</span>
            <span><CheckCircle2 size={15} /> Matching không sử dụng thông tin lương</span>
            <span><ShieldCheck size={15} /> JWT và phân quyền User/Admin</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card__icon"><Sparkles size={22} /></div>
          <small>{mode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}</small>
          <h2>{mode === "login" ? "Đăng nhập VinCareer" : "Bắt đầu hành trình"}</h2>
          <p>
            {mode === "login"
              ? "Tiếp tục với Portfolio và lịch sử cá nhân của bạn."
              : "Tạo tài khoản Sinh viên miễn phí."}
          </p>

          <div className="auth-mode-switch">
            <button
              type="button"
              className={mode === "login" ? "is-active" : ""}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              className={mode === "register" ? "is-active" : ""}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence initial={false}>
              {mode === "register" && (
                <motion.label
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>Họ và tên</span>
                  <div><UserRound size={16} />
                    <input
                      value={form.full_name}
                      onChange={(event) => update("full_name", event.target.value)}
                      required
                      minLength={2}
                      placeholder="Nguyễn Minh Anh"
                    />
                  </div>
                </motion.label>
              )}
            </AnimatePresence>
            <label>
              <span>Email</span>
              <div><Mail size={16} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  required
                  placeholder="student@example.com"
                />
              </div>
            </label>
            <label>
              <span>Mật khẩu</span>
              <div><LockKeyhole size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => update("password", event.target.value)}
                  required
                  minLength={8}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="journey-spinner" /> : (
                <>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"} <ArrowRight size={16} /></>
              )}
            </button>
          </form>
          <small className="auth-security-note">
            <ShieldCheck size={12} /> Mật khẩu được băm Argon2 ở Backend.
          </small>
        </section>
      </motion.div>
    </div>
  );
}
