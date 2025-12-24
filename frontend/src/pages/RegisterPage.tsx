import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, name || undefined);
      navigate("/notes");
    } catch (err: any) {
      setError(err.response?.data?.error || "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="mb-6 text-center text-gray-800">注册</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-2 text-gray-700 font-medium"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block mb-2 text-gray-700 font-medium"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-600"
            />
            <small className="block mt-1 text-gray-600 text-sm">
              密码至少8位，包含字母和数字
            </small>
          </div>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block mb-2 text-gray-700 font-medium"
            >
              昵称（可选）
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full px-3 py-3 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-600"
            />
          </div>
          {error && (
            <div className="text-red-600 mb-4 px-2 py-2 bg-red-100 rounded text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-3 py-3 bg-blue-600 text-white border-none rounded text-base cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          已有账号？{" "}
          <Link
            to="/login"
            className="text-blue-600 no-underline hover:underline"
          >
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
