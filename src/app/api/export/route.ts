import { getUser } from "@/lib/auth";
import { getExportRows, LEVELS } from "@/lib/queries";
import { today } from "@/lib/dates";

export const dynamic = "force-dynamic";

const SEP = ";"; // Excel în setări regionale românești folosește ';'

function cell(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  // protecție împotriva "formula injection" în Excel
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response("Neautorizat", { status: 401 });

  const url = new URL(request.url);
  const userParam = url.searchParams.get("user");
  const isAdmin = user.role === "admin";

  // Userul obișnuit își exportă doar datele proprii.
  // Adminul exportă toate datele, sau doar pe ale unui user (?user=ID).
  let scope: number | undefined;
  if (!isAdmin) scope = user.id;
  else if (userParam && /^\d+$/.test(userParam)) scope = Number(userParam);

  const rows = await getExportRows(scope);
  const withUser = isAdmin && !scope;

  const header: string[] = [];
  if (isAdmin) header.push("Utilizator", "Email");
  header.push("Nr. înger", "Înger", "Data evocării", "Mesaj", "Senzație");
  for (let d = 1; d <= 7; d++) {
    for (const l of LEVELS) header.push(`Ziua ${d} - ${l.label}`);
  }

  const lines = [header.map(cell).join(SEP)];
  for (const r of rows) {
    const line: (string | number)[] = [];
    if (isAdmin) line.push(r.user_name, r.user_email);
    line.push(r.angel_id, r.angel_name, r.evoked_on, r.message, r.sensation);
    for (let d = 1; d <= 7; d++) {
      const e = r.days[d];
      for (const l of LEVELS) line.push(e?.[l.key] ?? "");
    }
    lines.push(line.map(cell).join(SEP));
  }

  const label = withUser ? "toti-userii" : `utilizator-${scope}`;
  const filename = `shem-${label}-${today()}.csv`;

  // BOM UTF-8 ca Excel să afișeze corect diacriticele
  const body = "\uFEFF" + lines.join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
