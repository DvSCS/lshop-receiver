"use client";

import { useEffect, useState } from "react";
import { Copy, Check, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import clsx from "clsx";

type Email = {
  id: string;
  from: string;
  subject: string;
  bodyText: string;
  receivedAt: string;
};

export default function InboxPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [emailAddress, setEmailAddress] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const fetchEmails = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch(`/api/emails?code=${code}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 404) {
          router.push("/");
          return;
        }
        throw new Error("Falha ao carregar emails");
      }
      const data = await res.json();
      setEmailAddress(data.emailAddress);
      setEmails(data.emails || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!code) return;
    fetchEmails();

    const interval = setInterval(() => {
      fetchEmails(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [code]);

  const handleRefresh = () => {
    fetchEmails();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#f3f2f1]">
      {/* LSHOP Red style top navbar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#e60000] text-white px-4 py-3 shadow-sm z-10 shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/")}
            className="hover:bg-white/10 p-1.5 rounded transition-colors shrink-0"
            title="Sair"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-6 object-contain brightness-0 invert shrink-0" />
            <h1 className="text-base font-bold uppercase italic shrink-0">Receiver</h1>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto bg-white/10 px-3 py-1.5 rounded-sm">
          <span className="text-sm font-medium mr-3 truncate">{emailAddress || "Carregando..."}</span>
          <button 
            onClick={copyToClipboard}
            className="hover:bg-white/20 p-1 rounded transition-colors flex items-center justify-center shrink-0"
            title="Copiar"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Email List (Sidebar) */}
        <div className={clsx("w-full md:w-[350px] lg:w-[400px] flex-col bg-white border-r border-gray-300 z-0 shrink-0", selectedEmail ? "hidden md:flex" : "flex")}>
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-[15px] font-semibold text-gray-800">Caixa de Entrada</h2>
            <button 
              onClick={handleRefresh} 
              className={clsx("p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors", loading && "animate-spin")}
              title="Sincronizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading && emails.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 text-center">Carregando...</div>
            ) : emails.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 text-center">Nenhum email recebido.</div>
            ) : (
              <div className="flex flex-col">
                {emails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={clsx(
                      "text-left p-4 border-b border-gray-100 hover:bg-[#f3f2f1] transition-colors focus:outline-none",
                      selectedEmail?.id === email.id ? "bg-[#fff5f5] border-l-[3px] border-l-[#e60000]" : "bg-white border-l-[3px] border-l-transparent"
                    )}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={clsx("text-[15px] truncate pr-2 text-gray-900", selectedEmail?.id === email.id ? "font-semibold" : "")}>{email.from}</span>
                      <span suppressHydrationWarning className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-800 truncate mb-1">{email.subject || "Sem Assunto"}</p>
                    <p className="text-[13px] text-gray-500 truncate">{email.bodyText}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Viewer (Reading Pane) */}
        <div className={clsx("flex-1 flex-col bg-white", selectedEmail ? "flex" : "hidden md:flex")}>
          {selectedEmail ? (
            <>
              <div className="p-4 md:p-8 border-b border-gray-200">
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden flex items-center gap-1 text-sm text-[#e60000] font-medium mb-4 hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar pra lista
                </button>
                <h1 className="text-xl font-semibold text-gray-900 mb-4">{selectedEmail.subject || "Sem Assunto"}</h1>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[#e60000] text-white flex items-center justify-center font-semibold text-sm uppercase">
                      {selectedEmail.from.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{selectedEmail.from}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-10" suppressHydrationWarning>
                    {new Date(selectedEmail.receivedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="text-[15px] text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedEmail.bodyText}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#f3f2f1] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500 font-medium">Selecione um item para leitura</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
