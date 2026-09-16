import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Código não fornecido" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!account) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    // 1. Pegar Token
    const tokenRes = await fetch("https://api.mail.tm/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({
        address: account.email,
        password: account.password
      })
    });

    if (!tokenRes.ok) {
      throw new Error("Erro de autenticação no mail.tm");
    }

    const { token } = await tokenRes.json();

    // 2. Pegar a lista de mensagens
    const msgRes = await fetch("https://api.mail.tm/messages", {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!msgRes.ok) throw new Error("Erro ao buscar mensagens no mail.tm");
    
    const msgData = await msgRes.json();
    const messages = Array.isArray(msgData) ? msgData : (msgData["hydra:member"] || []);

    // 3. Mapear pro formato do nosso Frontend
    // O mail.tm retorna `intro` que é um pedaço do texto. 
    // Para ter performance rápida, mostramos o intro. Se precisar do body todo, busca o detalhe.
    // Pra manter 100% compativel com nosso frontend sem refatorar muito, vamos buscar o conteudo real dos ultimos 5 emails em paralelo.
    
    const emailsToProcess = messages.slice(0, 10);
    const fullEmails = await Promise.all(emailsToProcess.map(async (m: any) => {
      try {
        const detailRes = await fetch(`https://api.mail.tm/messages/${m.id}`, {
          headers: { 
            "Authorization": `Bearer ${token}`, 
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        const detail = await detailRes.json();
        return {
          id: m.id,
          from: m.from?.address || "Desconhecido",
          subject: m.subject || "Sem Assunto",
          bodyText: detail.text || m.intro || "",
          bodyHtml: detail.html || "",
          receivedAt: m.createdAt
        };
      } catch (e) {
        // Se der erro ao buscar detalhe, cai pro basico
        return {
          id: m.id,
          from: m.from?.address || "Desconhecido",
          subject: m.subject || "Sem Assunto",
          bodyText: m.intro || "",
          bodyHtml: "",
          receivedAt: m.createdAt
        };
      }
    }));

    return NextResponse.json({
      success: true,
      emailAddress: account.email,
      emails: fullEmails,
    });
  } catch (error: any) {
    console.error("Emails Fetch Error:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
  }
}
