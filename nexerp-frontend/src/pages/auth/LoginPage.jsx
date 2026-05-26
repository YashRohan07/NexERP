import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { getToken, saveAuth } from "../../utils/auth";

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@nexerp.com",
    password: "password",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (getToken()) {
    return <Navigate to="/" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function extractLoginData(responseData) {
    const payload = responseData?.data || responseData;

    return {
      token: payload?.token || payload?.access_token,
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
      navigate("/");
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">NexERP</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to continue to your dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@nexerp.com"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="password"
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
          <p className="font-semibold text-gray-700">Seeded users</p>
          <p className="mt-2">Admin: admin@nexerp.com / password</p>
          <p>Member: member@nexerp.com / password</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
