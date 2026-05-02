"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error || "Invalid credentials.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form
        className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        onSubmit={handleSubmit}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-bold">Sign in to Easymotor</h1>
        <label className="mt-8 block text-sm font-medium">
          Username
          <input
            autoComplete="username"
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 dark:border-zinc-700"
            onChange={(event) => setUsername(event.target.value)}
            required
            type="text"
            value={username}
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            autoComplete="current-password"
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 dark:border-zinc-700"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <button
          className="mt-6 w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-950"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
