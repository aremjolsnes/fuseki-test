import { promises as fs } from "fs";
import path from "path";
import type { BatchReport, BatchReportSummary, SavedQuery } from "./types";

const QUERIES_DIR = path.join(process.cwd(), "queries");
const REPORTS_DIR = path.join(process.cwd(), "data", "reports");

/** Filename-safe query name: letters, numbers, space, _ and - only. */
export function safeName(name: string): string {
  const base = name
    .trim()
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  if (!base) throw new Error("Ugyldig navn.");
  return base;
}

function safeId(id: string): string {
  const s = id.replace(/[^0-9A-Za-z_-]/g, "");
  if (!s) throw new Error("Ugyldig id.");
  return s;
}

export async function listQueries(): Promise<SavedQuery[]> {
  await fs.mkdir(QUERIES_DIR, { recursive: true });
  const files = (await fs.readdir(QUERIES_DIR)).filter((f) =>
    f.endsWith(".rq"),
  );
  const out: SavedQuery[] = [];
  for (const f of files.sort()) {
    const query = await fs.readFile(path.join(QUERIES_DIR, f), "utf8");
    out.push({ name: f.replace(/\.rq$/, ""), query });
  }
  return out;
}

export async function saveQuery(
  name: string,
  query: string,
): Promise<SavedQuery> {
  await fs.mkdir(QUERIES_DIR, { recursive: true });
  const n = safeName(name);
  await fs.writeFile(path.join(QUERIES_DIR, `${n}.rq`), query, "utf8");
  return { name: n, query };
}

export async function deleteQuery(name: string): Promise<void> {
  await fs.rm(path.join(QUERIES_DIR, `${safeName(name)}.rq`), {
    force: true,
  });
}

export async function saveReport(report: BatchReport): Promise<void> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(REPORTS_DIR, `${safeId(report.id)}.json`),
    JSON.stringify(report, null, 2),
    "utf8",
  );
}

export async function getReport(id: string): Promise<BatchReport | null> {
  try {
    const raw = await fs.readFile(
      path.join(REPORTS_DIR, `${safeId(id)}.json`),
      "utf8",
    );
    return JSON.parse(raw) as BatchReport;
  } catch {
    return null;
  }
}

function summarize(r: BatchReport): BatchReportSummary {
  let equal = 0;
  let differing = 0;
  let incomparable = 0;
  for (const it of r.items) {
    if (!it.diffComparable) incomparable++;
    else if (it.diffEqual) equal++;
    else differing++;
  }
  return {
    id: r.id,
    createdAt: r.createdAt,
    count: r.items.length,
    equal,
    differing,
    incomparable,
  };
}

export async function listReportSummaries(): Promise<BatchReportSummary[]> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  const files = (await fs.readdir(REPORTS_DIR)).filter((f) =>
    f.endsWith(".json"),
  );
  const out: BatchReportSummary[] = [];
  for (const f of files.sort().reverse()) {
    try {
      const r = JSON.parse(
        await fs.readFile(path.join(REPORTS_DIR, f), "utf8"),
      ) as BatchReport;
      out.push(summarize(r));
    } catch {
      // skip unreadable/legacy files
    }
  }
  return out;
}

export function newReportId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
