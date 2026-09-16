import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { code, username } = await req.json();

    if (!code || typeof code !== "string" || code.length < 3) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const existingAccount = await prisma.account.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingAccount) {
      return NextResponse.json({ error: "Código já existe" }, { status: 400 });
    }

    // 1. Pegar domínios disponíveis do mail.tm
    const domainRes = await fetch("https://api.mail.tm/domains");
    if (!domainRes.ok) throw new Error("Erro ao buscar domínios do mail.tm");
    const domainData = await domainRes.json();
    
    if (!domainData["hydra:member"] || domainData["hydra:member"].length === 0) {
      throw new Error("Nenhum domínio disponível no mail.tm");
    }

    const domain = domainData["hydra:member"][0].domain;

    // 2. Gerar email e senha únicos
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const baseName = username ? username.toLowerCase().replace(/[^a-z0-9]/g, "") : `vault_${code.toLowerCase()}`;
    const emailAddress = `${baseName}_${randomSuffix}@${domain}`;
    const password = crypto.randomBytes(12).toString("hex");

    // 3. Criar conta no mail.tm
    const createRes = await fetch("https://api.mail.tm/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        address: emailAddress,
        password: password
      })
    });

    if (!createRes.ok) {
      const errData = await createRes.text();
      console.error("Mail.tm create error:", errData);
      throw new Error("Erro ao criar conta no mail.tm");
    }

    // 4. Salvar no nosso banco
    const account = await prisma.account.create({
      data: {
        code: code.toUpperCase(),
        email: emailAddress,
        password: password,
      },
    });

    return NextResponse.json({
      success: true,
      account: {
        code: account.code,
        email: account.email
      }
    });

  } catch (error) {
    console.error("Admin Create Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
