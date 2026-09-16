import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const oldAccounts = [
      {
        id: '82126b4c-d02d-4fe5-9148-6967549542f9',
        code: '676767',
        email: 'vault_676767_6a801af8@uberip.com',
        password: '0c4b4ec21e7dad0c9a031788',
      },
      {
        id: '82dc66b6-75f3-4147-913c-b8c0afb37606',
        code: 'W4ND4WIN',
        email: 'gbrfazendeira_778496@uberip.com',
        password: '358bcf64cddbf7b9a7df0b49',
      }
    ];

    for (const acc of oldAccounts) {
      const exists = await prisma.account.findUnique({ where: { code: acc.code } });
      if (!exists) {
        await prisma.account.create({ data: acc });
      }
    }

    return NextResponse.json({ success: true, message: "Migração completa" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
