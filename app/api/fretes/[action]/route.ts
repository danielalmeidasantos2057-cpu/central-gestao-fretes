import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["initial", "dashboard", "searchClients", "getClientByCode", "searchCarriers", "history", "historyDetail", "submitFreight"]);

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (!ALLOWED.has(action)) return NextResponse.json({ ok: false, error: "Ação não permitida." }, { status: 404 });
  const endpoint = process.env.FRETES_APPS_SCRIPT_URL;
  const token = process.env.FRETES_API_TOKEN;
  if (!endpoint || !token) return NextResponse.json({ ok: false, error: "Integração ainda não configurada. Configure FRETES_APPS_SCRIPT_URL e FRETES_API_TOKEN no servidor." }, { status: 503 });
  let payload: unknown = {};
  try { payload = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Corpo JSON inválido." }, { status: 400 }); }
  try {
    const upstream = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, token, payload }), cache: "no-store", redirect: "follow" });
    const text = await upstream.text();
    let data: any;
    try { data = JSON.parse(text); } catch { return NextResponse.json({ ok: false, error: "O Apps Script não retornou JSON. Confira a implantação e as permissões." }, { status: 502 }); }
    return NextResponse.json(data, { status: upstream.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Falha de comunicação com o Apps Script." }, { status: 502 });
  }
}
