"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Aspirant } from "@/lib/types";

export interface VerifyResult {
  ok: boolean;
  error?: string;
  positions?: { position: string; aspirants: Aspirant[] }[];
}

export async function verifyVoterCode(rawCode: string): Promise<VerifyResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter your access code." };

  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from("election_settings")
    .select("is_open")
    .eq("id", 1)
    .single();

  if (settings && settings.is_open === false) {
    return { ok: false, error: "Voting is currently closed." };
  }

  const { data: voter, error: voterError } = await supabase
    .from("voters")
    .select("id, is_used")
    .eq("code", code)
    .maybeSingle();

  if (voterError || !voter) {
    return { ok: false, error: "That code isn't recognized. Check it and try again." };
  }
  if (voter.is_used) {
    return { ok: false, error: "This code has already been used to vote." };
  }

  const { data: aspirants, error: aspirantsError } = await supabase
    .from("aspirants")
    .select("*")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (aspirantsError || !aspirants) {
    return { ok: false, error: "Couldn't load the ballot. Try again shortly." };
  }

  const grouped = new Map<string, Aspirant[]>();
  for (const a of aspirants as Aspirant[]) {
    const list = grouped.get(a.position) || [];
    list.push(a);
    grouped.set(a.position, list);
  }

  const positions = Array.from(grouped.entries()).map(([position, list]) => ({
    position,
    aspirants: list,
  }));

  if (positions.length === 0) {
    return { ok: false, error: "No aspirants have been added yet. Check back later." };
  }

  return { ok: true, positions };
}

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

export async function submitVotes(
  rawCode: string,
  selections: Record<string, string> // position -> aspirant_id
): Promise<SubmitResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Missing access code." };

  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from("election_settings")
    .select("is_open")
    .eq("id", 1)
    .single();
  if (settings && settings.is_open === false) {
    return { ok: false, error: "Voting is currently closed." };
  }

  const { data: voter, error: voterError } = await supabase
    .from("voters")
    .select("id, is_used")
    .eq("code", code)
    .maybeSingle();

  if (voterError || !voter) return { ok: false, error: "That code isn't recognized." };
  if (voter.is_used) return { ok: false, error: "This code has already been used to vote." };

  const entries = Object.entries(selections).filter(([, aspirantId]) => !!aspirantId);
  if (entries.length === 0) {
    return { ok: false, error: "Select at least one candidate before submitting." };
  }

  const rows = entries.map(([position, aspirant_id]) => ({
    voter_id: voter.id,
    aspirant_id,
    position,
  }));

  const { error: votesError } = await supabase.from("votes").insert(rows);
  if (votesError) {
    // TEMPORARY: surface the real error for debugging
    return { ok: false, error: `DEBUG: ${votesError.message} (code: ${votesError.code})` };
  }

  await supabase
    .from("voters")
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq("id", voter.id);

  return { ok: true };
}
