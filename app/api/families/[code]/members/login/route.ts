import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/src/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    // ==========================
    // 1) Sacar code desde la URL
    // ==========================
    const { pathname } = req.nextUrl;
    // /api/families/OXE508/members/perfil
    // split → ["", "api", "families", "OXE508", "members", "login"]
    const parts = pathname.split("/").filter(Boolean);
    // ["api", "families", "OXE508", "members", "login"]
    const rawCode = parts[2]; // index 0 = api, 1 = families, 2 = OXE508
    const code = (rawCode || "").trim().toUpperCase();

    // ==========================
    // 2) Leer body
    // ==========================
    const body = await req.json().catch(() => null);
    const { name, pin } = (body as any) ?? {};

    console.log("[LOGIN] pathname =", pathname);
    console.log("[LOGIN] parts =", parts);
    console.log("[LOGIN] rawCode =", rawCode, "code =", code);
    console.log("[LOGIN] body =", body);

    if (!name || !pin) {
      return NextResponse.json(
        { message: "Datos incompletos." },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { message: "Código de familia inválido." },
        { status: 400 }
      );
    }

    // ==========================
    // 3) Buscar familia
    // ==========================
    const { data: family, error: famError } = await supabaseServer
      .from("families")
      .select("id, code, name")
      .eq("code", code)
      .maybeSingle();

    console.log("[LOGIN] family =", family, "famError =", famError);

    if (!family) {
      return NextResponse.json(
        { message: "Familia no encontrada." },
        { status: 404 }
      );
    }

    // ==========================
    // 4) Buscar miembro
    // ==========================
    const { data: member, error: memError } = await supabaseServer
      .from("members")
      .select("id, name, pin_hash")
      .eq("family_id", family.id)
      .eq("name", name)
      .maybeSingle();

    console.log("[LOGIN] member =", member, "memError =", memError);

    if (!member) {
      return NextResponse.json(
        { message: "Miembro no encontrado." },
        { status: 404 }
      );
    }

    // ==========================
    // 5) Validar PIN
    // ==========================
    const isValid = await bcrypt.compare(pin, member.pin_hash);
    if (!isValid) {
      return NextResponse.json(
        { message: "PIN incorrecto." },
        { status: 401 }
      );
    }

    // ==========================
    // 6) Buscar TODAS las listas del miembro
    // ==========================
    const { data: lists, error: listError } = await supabaseServer
      .from("lists")
      .select("id, title")
      .eq("member_id", member.id)
      .order("created_at", { ascending: true });

    console.log("[LOGIN] lists =", lists, "listError =", listError);

    if (listError) {
      return NextResponse.json(
        { message: "Error al cargar las listas del miembro." },
        { status: 500 }
      );
    }

    // Nota: aunque no tenga listas, devolvemos lists: []
    // y dejamos que el frontend decida qué hacer
    return NextResponse.json(
      {
        familyCode: family.code,
        member: {
          id: member.id,
          name: member.name,
        },
        lists: lists ?? [],
        token: "mock-token",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[LOGIN] error inesperado:", err);
    return NextResponse.json(
      { message: "Error interno al iniciar sesión." },
      { status: 500 }
    );
  }
}
