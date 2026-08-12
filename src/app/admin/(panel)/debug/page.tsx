import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function describe(value: string | undefined) {
  if (value === undefined) return "❌ NOT SET (missing from Vercel env vars)";
  const hasLeadingSpace = /^\s/.test(value);
  const hasTrailingSpace = /\s$/.test(value);
  const hasNewline = /[\r\n]/.test(value);
  const issues = [
    hasLeadingSpace && "leading whitespace",
    hasTrailingSpace && "trailing whitespace",
    hasNewline && "contains a newline",
  ].filter(Boolean);
  return `length=${value.length}${issues.length ? " ⚠️ " + issues.join(", ") : " ✅ looks clean"}`;
}

export default async function DebugPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let rawFetchResult = "not attempted";
  if (url && service) {
    try {
      const res = await fetch(`${url.trim()}/rest/v1/aspirants?select=id&limit=1`, {
        headers: {
          apikey: service.trim(),
          Authorization: `Bearer ${service.trim()}`,
        },
        cache: "no-store",
      });
      const text = await res.text();
      rawFetchResult = `HTTP ${res.status} — ${text.slice(0, 300)}`;
    } catch (e) {
      rawFetchResult = `Fetch threw: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  let clientResult = "not attempted";
  try {
    const supabase = createAdminClient();
    const { error, count } = await supabase
      .from("aspirants")
      .select("*", { count: "exact", head: true });
    clientResult = error ? `Error: ${error.message}` : `OK — count=${count}`;
  } catch (e) {
    clientResult = `Threw: ${e instanceof Error ? e.message : String(e)}`;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl mb-6">Connection diagnostics</h1>
      <p className="text-muted text-sm mb-8">
        Temporary debug page — safe to delete once things are working. Doesn&apos;t print your
        actual secret keys, just whether they look correctly formatted.
      </p>

      <div className="ballot-card p-6 space-y-4 font-tally text-sm">
        <div>
          <p className="text-muted mb-1">NEXT_PUBLIC_SUPABASE_URL (full value, this one is safe to show):</p>
          <p className="break-all">{JSON.stringify(url)}</p>
        </div>
        <div>
          <p className="text-muted mb-1">NEXT_PUBLIC_SUPABASE_ANON_KEY:</p>
          <p>{describe(anon)}</p>
        </div>
        <div>
          <p className="text-muted mb-1">SUPABASE_SERVICE_ROLE_KEY:</p>
          <p>{describe(service)}</p>
        </div>
        <div className="perforated pt-4">
          <p className="text-muted mb-1">Raw fetch to your Supabase REST endpoint:</p>
          <p className="break-all">{rawFetchResult}</p>
        </div>
        <div className="perforated pt-4">
          <p className="text-muted mb-1">Supabase client query result:</p>
          <p className="break-all">{clientResult}</p>
        </div>
      </div>
    </div>
  );
}
