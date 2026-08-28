import { NextResponse } from "next/server";
import { deleteQuery, listQueries, saveQuery } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listQueries());
}

export async function POST(req: Request) {
  let body: { name?: unknown; query?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name : "";
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!name.trim() || !query) {
    return NextResponse.json(
      { error: "Både navn og spørring må fylles ut." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await saveQuery(name, query));
  } catch (e) {
    return NextResponse.json(
      { error: String((e as Error).message ?? e) },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  const name = new URL(req.url).searchParams.get("name") ?? "";
  if (!name.trim()) {
    return NextResponse.json({ error: "Mangler ?name=" }, { status: 400 });
  }
  try {
    await deleteQuery(name);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: String((e as Error).message ?? e) },
      { status: 400 },
    );
  }
}
