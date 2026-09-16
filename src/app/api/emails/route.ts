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

    return NextResponse.json({
      success: true,
      emailAddress: account.email,
      password: account.password,
    });
  } catch (error: any) {
    console.error("Emails Fetch Error:", error);
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
  }
}
