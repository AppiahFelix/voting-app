"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Aspirant } from "@/lib/types";

interface Row extends Aspirant {
  vote_count: number;
  justUpdated: boolean;
}

export default function ResultsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitle] = useState("Election");
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const [{ data: aspirants }, { data: votes }, { data: settings }] = await Promise.all([
        supabase.from("aspirants").select("*").order("position").order("created_at"),
        supabase.from("votes").select("aspirant_id"),
        supabase.from("election_settings").select("title").eq("id", 1).single(),
      ]);

      if (!active) return;

      const counts = new Map<string, number>();
      (votes || []).forEach((v: { aspirant_id: string }) => {
        counts.set(v.aspirant_id, (counts.get(v.aspirant_id) || 0) + 1);
      });

      const nextRows: Row[] = (aspirants || []).map((a: Aspirant) => ({
        ...a,
        vote_count: counts.get(a.id) || 0,
        justUpdated: false,
      }));

      setRows(nextRows);
      if (settings?.title) setTitle(settings.title);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("votes-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes" },
        (payload) => {
          const aspirantId = (payload.new as { aspirant_id: string }).aspirant_id;
          setRows((prev) =>
            prev.map((r) =>
              r.id === aspirantId
                ? { ...r, vote_count: r.vote_count + 1, justUpdated: true }
                : { ...r, justUpdated: false }
            )
          );
          setTimeout(() => {
            setRows((prev) => prev.map((r) => ({ ...r, justUpdated: false })));
          }, 550);
        }
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const list = map.get(r.position) || [];
      list.push(r);
      map.set(r.position, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.vote_count - a.vote_count);
    }
    return Array.from(map.entries());
  }, [rows]);

  const totalVotes = rows.reduce((sum, r) => sum + r.vote_count, 0);

  return (
    <main className="flex-1 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="font-tally text-xs tracking-[0.3em] text-muted uppercase mb-2">
              Live Results
            </p>
            <h1 className="font-display text-4xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted font-tally shrink-0 mt-2">
            <span
              className={`w-2 h-2 rounded-full ${connected ? "bg-counted" : "bg-line"}`}
              aria-hidden
            />
            {connected ? "Live" : "Connecting…"}
          </div>
        </div>
        <p className="text-muted mb-10">
          {totalVotes} ballot{totalVotes === 1 ? "" : "s"} counted so far. This page updates
          automatically as votes come in.
        </p>

        {loading && <p className="text-muted">Loading results…</p>}

        {!loading && grouped.length === 0 && (
          <p className="text-muted">No aspirants have been added yet.</p>
        )}

        <div className="space-y-10">
          {grouped.map(([position, aspirants]) => {
            const positionTotal = aspirants.reduce((s, a) => s + a.vote_count, 0);
            const leaderCount = aspirants[0]?.vote_count ?? 0;
            return (
              <section key={position}>
                <h2 className="font-display text-2xl mb-4">{position}</h2>
                <div className="space-y-3">
                  {aspirants.map((a) => {
                    const pct = positionTotal > 0 ? (a.vote_count / positionTotal) * 100 : 0;
                    const isLeading = a.vote_count === leaderCount && leaderCount > 0;
                    return (
                      <div key={a.id} className="ballot-card p-4">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-3">
                            {a.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={a.photo_url}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover border border-line shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-line shrink-0" aria-hidden />
                            )}
                            <div>
                            <span className="font-medium">{a.name}</span>
                            {isLeading && (
                              <span className="ml-2 text-xs font-tally text-counted uppercase tracking-wide">
                                Leading
                              </span>
                            )}
                            <span className="block text-xs text-muted">
                              {[a.category, a.sex].filter(Boolean).join(" · ") || undefined}
                            </span>
                            </div>
                          </div>
                          <span
                            className={`font-tally text-2xl tabular-nums ${
                              a.justUpdated ? "tally-updated" : ""
                            }`}
                          >
                            {a.vote_count}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-line overflow-hidden">
                          <div
                            className="h-full bg-[var(--seal)] transition-all duration-500 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
