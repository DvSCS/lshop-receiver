"use client";

import { useState } from "react";

export default function GeradorPage() {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 3) {
      setError("Código precisa de no mínimo 3 caracteres");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, username })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar conta");
      }
      
      setMessage(`Sucesso! Código: ${data.code} | Email atrelado: ${data.email}`);
      setCode("");
      setUsername("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-[#f3f2f1]">
      <div className="w-full max-w-[500px]">
        <div className="bg-white border border-gray-300 p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight uppercase italic mb-1">Painel Secreto</h1>
            <p className="text-sm text-gray-600 text-center">Gere novos códigos de acesso para os clientes.</p>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Código de Acesso (Ex: W4nd4win)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-white border border-gray-400 text-gray-900 px-3 py-2 text-[15px] focus:outline-none focus:border-[#e60000] focus:ring-1 focus:ring-[#e60000]"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700 uppercase">Nome Opcional pro Email (Ex: gbrfazendeira)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-gray-400 text-gray-900 px-3 py-2 text-[15px] focus:outline-none focus:border-[#e60000] focus:ring-1 focus:ring-[#e60000]"
              />
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}
            {message && <div className="p-3 bg-green-50 text-green-700 text-sm border border-green-200 font-semibold">{message}</div>}

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#e60000] text-white hover:bg-[#cc0000] font-semibold py-2 px-6 text-sm transition-all disabled:opacity-50"
              >
                {loading ? "Gerando..." : "Criar Acesso"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
