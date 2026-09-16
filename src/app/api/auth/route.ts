import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!account) {
      return NextResponse.json({ error: "Código não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      emailAddress: account.email,
    });
  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
