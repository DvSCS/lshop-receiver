"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 3) {
      setError("Código muito curto");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Código inválido");
      }
      
      router.push(`/inbox/${code.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#f3f2f1]">
      <div className="w-full max-w-[440px]">
        <div className="bg-white border border-gray-300 p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img src="/logo.png" alt="LSHOP Logo" className="h-10 object-contain" />
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight uppercase italic">Receiver</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">Acessar sua caixa de entrada</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <input
                id="code"
                type="text"
                placeholder="Código de acesso"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-gray-400 text-gray-900 px-3 py-2 text-[15px] focus:outline-none focus:border-[#e60000] focus:ring-1 focus:ring-[#e60000] transition-all hover:border-gray-500"
                autoComplete="off"
                autoFocus
              />
              {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#e60000] text-white hover:bg-[#cc0000] font-semibold py-1.5 px-6 text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? "Verificando..." : "Avançar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
