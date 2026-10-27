import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED = new Set([
  "initial",
  "dashboard",
  "searchClients",
  "getClientByCode",
  "searchCarriers",
  "history",
  "historyDetail",
  "submitFreight",
])

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ action: string }> },
) {
  const { action } = await ctx.params
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ ok: false, error: "Ação não permitida." }, { status: 404 })
  }

  const endpoint = process.env.FRETES_APPS_SCRIPT_URL
  const token = process.env.FRETES_API_TOKEN
  if (!endpoint || !token) {
    return NextResponse.json(
      { ok: false, error: "Integração não configurada no servidor. Confira FRETES_APPS_SCRIPT_URL e FRETES_API_TOKEN no ambiente Production do Vercel." },
      { status: 503 },
    )
  }

  let payload: unknown = {}
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Corpo JSON inválido enviado pelo frontend." }, { status: 400 })
  }

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, token, payload }),
      cache: "no-store",
      redirect: "follow",
    })

    const responseText = await upstream.text()
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data, { status: upstream.ok ? 200 : 502 })
    } catch {
      const contentType = upstream.headers.get("content-type") || "(ausente)"
      const finalUrl = upstream.url || "(indisponível)"
      // Return only a short sanitized excerpt to help diagnose HTML/login/permission pages.
      const excerpt = responseText
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 240)
      return NextResponse.json(
        {
          ok: false,
          error: "A resposta do Apps Script não é JSON.",
          diagnostic: {
            httpStatus: upstream.status,
            contentType,
            finalUrl,
            responseExcerpt: excerpt || "(resposta vazia)",
            guidance: "Se o trecho indicar login/permissão, revise a implantação do Web App e o acesso. Se indicar erro do script, confira as execuções no Apps Script.",
          },
        },
        { status: 502 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Falha de comunicação com o Apps Script." },
      { status: 502 },
    )
  }
}
