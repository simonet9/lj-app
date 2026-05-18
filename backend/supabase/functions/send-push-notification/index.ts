import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SendPushPayload {
  /** Un único userId o un array para batch */
  userIds: string | string[];
  title: string;
  body: string;
  /** Datos opcionales para navegación en el cliente */
  data?: {
    tipo?: "lista_espera" | "reserva_confirmada" | "clase_suspendida" | "cancelacion" | string;
    claseId?: string;
    reservaId?: string;
    [key: string]: unknown;
  };
  /** Idempotency key — evita envíos duplicados si se reintenta */
  idempotencyKey?: string;
  /** Prioridad Expo: 'default' | 'normal' | 'high' */
  priority?: "default" | "normal" | "high";
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: "default" | "normal" | "high";
  sound?: "default";
  badge?: number;
  channelId?: string;
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
// Expo recomienda chunks de max 100 mensajes por request
const CHUNK_SIZE = 100;

// ─── Helper: particionar array ────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── Helper: validar Expo Push Token ─────────────────────────────────────────

function isValidExpoPushToken(token: string): boolean {
  return (
    token.startsWith("ExponentPushToken[") ||
    token.startsWith("ExpoPushToken[")
  );
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // ── CORS preflight ────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const startAt = Date.now();

  // ── 1. Autenticación de la llamada ────────────────────────────────────────
  // Acepta llamadas desde Webhooks (Service Role Key) o clientes autenticados (JWT).
  const authHeader = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  let isAuthorized = authHeader.includes(serviceKey);

  // Si no es el webhook, verificamos si es un usuario válido
  if (!isAuthorized) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const client = createClient(Deno.env.get("SUPABASE_URL")!, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user } } = await client.auth.getUser();
    if (user) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return jsonError(401, "Unauthorized");
  }

  // ── 2. Parsear body ───────────────────────────────────────────────────────
  let payload: SendPushPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const { userIds, title, body, data = {}, priority = "high" } = payload;

  if (!userIds || !title || !body) {
    return jsonError(400, "Missing required fields: userIds, title, body");
  }

  const ids = Array.isArray(userIds) ? userIds : [userIds];

  if (ids.length === 0) {
    return jsonResponse({ sent: 0, errors: 0, message: "No recipients" });
  }

  // ── 3. Crear cliente Supabase con service_role (bypass RLS) ──────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // ── 4. Obtener tokens activos de los usuarios ─────────────────────────────
  const { data: tokenRows, error: tokenErr } = await supabase
    .from("user_push_tokens")
    .select("id, user_id, push_token, platform")
    .in("user_id", ids)
    .eq("active", true);

  if (tokenErr) {
    console.error("[push] Error fetching tokens:", tokenErr.message);
    return jsonError(500, "Error fetching push tokens");
  }

  if (!tokenRows || tokenRows.length === 0) {
    console.log("[push] No active tokens for users:", ids);
    return jsonResponse({ sent: 0, errors: 0, message: "No active tokens" });
  }

  // ── 5. Filtrar tokens válidos ─────────────────────────────────────────────
  const validTokenRows = tokenRows.filter((r) =>
    isValidExpoPushToken(r.push_token)
  );

  if (validTokenRows.length === 0) {
    console.warn("[push] All tokens are invalid format");
    return jsonResponse({ sent: 0, errors: 0, message: "No valid tokens" });
  }

  // ── 6. Construir mensajes Expo ────────────────────────────────────────────
  const messages: ExpoPushMessage[] = validTokenRows.map((r) => ({
    to: r.push_token,
    title,
    body,
    data: { ...data, userId: r.user_id },
    priority,
    sound: "default",
    channelId: "default", // Android notification channel
  }));

  // ── 7. Enviar en chunks a la Expo Push API ────────────────────────────────
  const chunks = chunk(messages, CHUNK_SIZE);
  const tokenRowsByToken = Object.fromEntries(
    validTokenRows.map((r) => [r.push_token, r])
  );

  let totalSent = 0;
  let totalErrors = 0;
  const tokensToInvalidate: string[] = [];

  for (const msgChunk of chunks) {
    let tickets: ExpoPushTicket[] = [];

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msgChunk),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`[push] Expo API error ${res.status}:`, text);
        totalErrors += msgChunk.length;
        continue;
      }

      const result = await res.json();
      tickets = result.data as ExpoPushTicket[];
    } catch (err) {
      console.error("[push] Network error calling Expo:", err);
      totalErrors += msgChunk.length;
      continue;
    }

    // ── 8. Procesar tickets ────────────────────────────────────────────────
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const token = msgChunk[i].to;
      const tokenRow = tokenRowsByToken[token];

      if (ticket.status === "ok") {
        totalSent++;
        console.log(`[push] ✅ Sent to ${token} (user: ${tokenRow?.user_id})`);
      } else {
        totalErrors++;
        const errCode = ticket.details?.error;
        console.warn(`[push] ❌ Error for token ${token}: ${ticket.message} (${errCode})`);

        // Invalidar tokens expirados automáticamente
        if (errCode === "DeviceNotRegistered" && tokenRow) {
          tokensToInvalidate.push(tokenRow.id);
        }
      }
    }
  }

  // ── 9. Invalidar tokens expirados ─────────────────────────────────────────
  if (tokensToInvalidate.length > 0) {
    console.log(`[push] Invalidating ${tokensToInvalidate.length} expired tokens`);
    const { error: invalidErr } = await supabase
      .from("user_push_tokens")
      .update({ active: false, updated_at: new Date().toISOString() })
      .in("id", tokensToInvalidate);

    if (invalidErr) {
      console.error("[push] Error invalidating tokens:", invalidErr.message);
    }
  }

  const elapsed = Date.now() - startAt;
  console.log(`[push] Done in ${elapsed}ms — sent: ${totalSent}, errors: ${totalErrors}`);

  return jsonResponse({
    sent: totalSent,
    errors: totalErrors,
    invalidated: tokensToInvalidate.length,
    elapsedMs: elapsed,
  });
});

// ─── Helpers de respuesta ─────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function jsonError(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}
