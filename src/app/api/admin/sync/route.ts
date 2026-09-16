import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { secret, accountId, messages } = data;

    // A simple hardcoded secret for the sync worker
    if (secret !== "SYNC_SECRET_123456") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!accountId || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Insert messages that don't exist yet
    let newCount = 0;
    for (const msg of messages) {
      const exists = await prisma.message.findUnique({
        where: { id: msg.id }
      });

      if (!exists) {
        await prisma.message.create({
          data: {
            id: msg.id,
            accountId: accountId,
            from: msg.from,
            subject: msg.subject,
            bodyText: msg.bodyText,
            bodyHtml: msg.bodyHtml || "",
            receivedAt: new Date(msg.receivedAt)
          }
        });
        newCount++;
      }
    }

    return NextResponse.json({ success: true, saved: newCount });
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Retorna a lista de contas ativas para o Worker saber o que buscar
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    
    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("Fetch Accounts Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
