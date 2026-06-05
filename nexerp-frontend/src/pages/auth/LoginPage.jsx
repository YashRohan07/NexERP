import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { getToken, saveAuth } from "../../utils/auth";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (getToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function extractLoginData(responseData) {
    const payload = responseData?.data || responseData || {};

    return {
      token: payload?.token || payload?.access_token || payload?.plainTextToken,
      user: payload?.user,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await login(form);
      const { token, user } = extractLoginData(response.data);

      if (!token || !user) {
        setError("Login response is missing token or user data.");
        return;
      }

      saveAuth(token, user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Login failed. Please check your email and password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold shadow-lg shadow-blue-950/30">
                N
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">NexERP</h1>
                <p className="text-sm text-blue-100">
                  Business Management System
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-blue-200">
              Business Control Center
            </p>

            <h2 className="text-5xl font-bold leading-tight tracking-tight">
              Run your daily business operations with clarity and control.
            </h2>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Track inventory, manage purchases and sales, process checkout, and
              monitor key business insights from a centralized dashboard.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">Stock</p>
                <p className="mt-1 text-xs text-slate-300">Live Tracking</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">Sales</p>
                <p className="mt-1 text-xs text-slate-300">Order Flow</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">Reports</p>
                <p className="mt-1 text-xs text-slate-300">Clear Insights</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} NexERP. All rights reserved.
          </p>
        </section>

        <main className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-200">
                N
              </div>

              <h1 className="text-3xl font-bold text-slate-950">NexERP</h1>
              <p className="mt-2 text-sm text-slate-500">
                Business Management System
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
              <div className="mb-7">
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  Sign in to your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your credentials to access the NexERP dashboard.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <Input
                  label="Email address"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />

                <Button
                  type="submit"
                  className="w-full rounded-xl py-3 text-sm font-semibold shadow-lg shadow-blue-200 transition hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-center text-xs leading-5 text-slate-500">
                  Secure access for authorized users only.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginPage;
