"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";

// ---------- Auth ----------

export async function loginAdmin(_prevState: { error?: string } | undefined, formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return { error: "Incorrect password. Try again." };
  }
  const token = await createSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

// ---------- Aspirants ----------

function safeExtension(file: File): string {
  const mimeSub = file.type?.split("/")?.[1];
  if (mimeSub) {
    const cleaned = mimeSub.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (cleaned) return cleaned === "jpeg" ? "jpg" : cleaned;
  }
  const nameParts = file.name.split(".");
  if (nameParts.length > 1) {
    const cleaned = (nameParts.pop() || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (cleaned) return cleaned;
  }
  return "jpg";
}

export async function addAspirant(_prevState: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const sex = String(formData.get("sex") || "").trim();
  const photo = formData.get("photo");

  if (!name || !position) {
    return { error: "Name and position are required." };
  }
  if (sex && sex !== "Male" && sex !== "Female") {
    return { error: "Sex must be Male or Female." };
  }

  const supabase = createAdminClient();

  let photo_url: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const looksLikeImage =
      photo.type.startsWith("image/") ||
      photo.type === "" ||
      /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?|svg)$/i.test(photo.name);
    if (!looksLikeImage) {
      return { error: "Photo must be an image file." };
    }
    if (photo.size > 8 * 1024 * 1024) {
      return { error: "Photo must be under 8MB." };
    }
    const path = `${crypto.randomUUID()}.${safeExtension(photo)}`;
    const { error: uploadError } = await supabase.storage
      .from("aspirant-photos")
      .upload(path, photo, { contentType: photo.type || "application/octet-stream" });
    if (uploadError) return { error: `Photo upload failed: ${uploadError.message}` };
    const { data: publicUrl } = supabase.storage.from("aspirant-photos").getPublicUrl(path);
    photo_url = publicUrl.publicUrl;
  }

  const { error } = await supabase.from("aspirants").insert({
    name,
    position,
    category: category || null,
    sex: sex || null,
    photo_url,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/aspirants");
  revalidatePath("/vote");
  revalidatePath("/results");
  return { error: undefined, success: true };
}

export async function deleteAspirant(id: string) {
  const supabase = createAdminClient();
  await supabase.from("aspirants").delete().eq("id", id);
  revalidatePath("/admin/aspirants");
  revalidatePath("/vote");
  revalidatePath("/results");
}

// ---------- Voter codes ----------

function randomCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function generateVoterCodes(_prevState: { error?: string } | undefined, formData: FormData) {
  const countRaw = Number(formData.get("count") || 0);
  const count = Math.min(Math.max(Math.floor(countRaw), 1), 5000);
  const labelPrefix = String(formData.get("labelPrefix") || "").trim();

  const supabase = createAdminClient();
  const rows = Array.from({ length: count }).map((_, i) => ({
    code: randomCode(),
    label: labelPrefix ? `${labelPrefix} ${i + 1}` : null,
  }));

  const { error } = await supabase.from("voters").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin/codes");
  return { error: undefined, success: true, generated: count };
}

export async function deleteUnusedCode(id: string) {
  const supabase = createAdminClient();
  await supabase.from("voters").delete().eq("id", id).eq("is_used", false);
  revalidatePath("/admin/codes");
}

// ---------- Election settings ----------

export async function setElectionOpen(isOpen: boolean) {
  const supabase = createAdminClient();
  await supabase.from("election_settings").update({ is_open: isOpen }).eq("id", 1);
  revalidatePath("/admin/dashboard");
  revalidatePath("/vote");
}

export async function updateElectionTitle(_prevState: { error?: string } | undefined, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Title can't be empty." };
  const supabase = createAdminClient();
  await supabase.from("election_settings").update({ title }).eq("id", 1);
  revalidatePath("/admin/dashboard");
  revalidatePath("/vote");
  revalidatePath("/results");
  return { error: undefined, success: true };
}
