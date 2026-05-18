import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Evento C: Notificación batch cuando una clase es suspendida ──────────────
//
// Disparado por: Database Webhook → AFTER UPDATE ON clases
// (cuando estado cambia a 'suspendida')
//
// Flujo:
//  1. Recibe clase_id (ya en estado 'suspendida')
//  2. Busca TODOS los socios con reserva confirmada en esa clase
//  3. Envía un push batch a todos en chunks de 100

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
    });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // ── Parsear payload ───────────────────────────────────────────────────────
  let payload: { claseId?: string; record?: Record<string, unknown>; old_record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return error(400, "Invalid JSON");
  }

  // Soporte llamada directa { claseId } o webhook DB { record }
  const claseId: string | undefined =
    payload.claseId ??
    (payload.record?.id as string | undefined);

  // Si viene del webhook: solo actuar cuando estado cambia a 'suspendida'
  if (payload.record) {
    const nuevoEstado = payload.record.estado as string | undefined;
    const estadoAnterior = payload.old_record?.estado as string | undefined;
    if (nuevoEstado !== "suspendida" || estadoAnterior === "suspendida") {
      return ok({ skipped: true, reason: "estado_no_relevante" });
    }
  }

  if (!claseId) return error(400, "Missing claseId");

  // ── 1. Obtener datos de la clase ──────────────────────────────────────────
  const { data: clase } = await supabase
    .from("clases")
    .select("id, disciplina, fecha, hora_inicio")
    .eq("id", claseId)
    .single();

  if (!clase) return error(404, "Clase not found");

  // ── 2. Obtener todos los socios con reserva confirmada ────────────────────
  const { data: reservas, error: reservasErr } = await supabase
    .from("reservas")
    .select("socio_id")
    .eq("clase_id", claseId)
    .eq("estado", "confirmada");

  if (reservasErr) {
    console.error("[suspendida] Error fetching reservas:", reservasErr.message);
    return error(500, "DB error");
  }

  if (!reservas || reservas.length === 0) {
    return ok({ notified: 0, reason: "no_reservas" });
  }

  const socioIds = [...new Set(reservas.map((r: { socio_id: string }) => r.socio_id))];

  // ── 3. Formatear mensaje ──────────────────────────────────────────────────
  const fechaFormateada = new Date(clase.fecha + "T00:00:00")
    .toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const horaFormateada = clase.hora_inicio?.slice(0, 5) ?? "";
  const disciplinaLabel: Record<string, string> = {
    futbol5: "Fútbol 5", padel: "Pádel", voley: "Vóley", basquet: "Básquet",
  };
  const disciplina = disciplinaLabel[clase.disciplina] ?? clase.disciplina;

  const title = "Clase suspendida ⚠️";
  const body = `La clase de ${disciplina} del ${fechaFormateada} a las ${horaFormateada}hs fue suspendida. Tu reserva fue cancelada automáticamente.`;

  // ── 4. Push batch ─────────────────────────────────────────────────────────
  const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      userIds: socioIds,
      title,
      body,
      data: { tipo: "clase_suspendida", claseId },
      priority: "high",
    }),
  });

  if (!sendRes.ok) {
    console.error("[suspendida] Error calling send-push:", await sendRes.text());
    return error(502, "Error sending push");
  }

  // ── 5. Insertar notificaciones internas para todos ────────────────────────
  const notificacionesInsert = socioIds.map((socioId: string) => ({
    usuario_id: socioId,
    titulo: title,
    cuerpo: body,
    tipo: "clase_suspendida",
    referencia_id: claseId,
  }));

  await supabase.from("notificaciones").insert(notificacionesInsert);

  const sendResult = await sendRes.json();
  console.log(`[suspendida] Clase ${claseId} — notificados: ${socioIds.length}, resultado:`, sendResult);

  return ok({ notified: socioIds.length, ...sendResult });
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}

function error(status: number, msg: string) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { "Content-Type": "application/json" } });
}
