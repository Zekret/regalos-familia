// app/api/families/[code]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getFamilyCodeFromUrl(req: NextRequest): string | null {
  const { pathname } = req.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  const rawCode = parts[2];
  if (!rawCode) return null;
  return rawCode.trim().toUpperCase();
}

// 🔹 GET: listar miembros de la familia + wishListsCount real
export async function GET(req: NextRequest) {
  try {
    const code = getFamilyCodeFromUrl(req);

    if (!code) {
      return NextResponse.json(
        { message: "Código de familia inválido.", members: [] },
        { status: 400 }
      );
    }

    // 1) Buscar familia
    const { data: family, error: famError } = await supabaseServer
      .from("families")
      .select("id, code, name")
      .eq("code", code)
      .maybeSingle();

    if (famError || !family) {
      return NextResponse.json(
        { message: "Familia no encontrada.", members: [] },
        { status: 404 }
      );
    }

    // 2) Buscar miembros de esa familia
    const { data: members, error: memError } = await supabaseServer
      .from("members")
      .select("id, name, created_at")
      .eq("family_id", family.id)
      .order("created_at", { ascending: true });

    if (memError) {
      console.error("[MEMBERS GET] error:", memError);
      return NextResponse.json(
        { message: "No se pudieron cargar los miembros.", members: [] },
        { status: 500 }
      );
    }

    const safeMembers = members ?? [];
    const memberIds = safeMembers.map((m) => m.id);

    // 3) Contar listas reales por miembro (tabla: lists)
    //    Filtramos por family_id para no contar listas de otras familias.
    let countByMemberId = new Map<string, number>();

    if (memberIds.length > 0) {
      const { data: lists, error: listsError } = await supabaseServer
        .from("lists")
        .select("id, member_id")
        .eq("family_id", family.id)
        .in("member_id", memberIds);

      if (listsError) {
        console.error("[MEMBERS GET] listsError:", listsError);
        return NextResponse.json(
          { message: "No se pudieron cargar las listas para contar.", members: [] },
          { status: 500 }
        );
      }

      for (const row of lists ?? []) {
        const key = row.member_id as string;
        countByMemberId.set(key, (countByMemberId.get(key) ?? 0) + 1);
      }
    }

    const membersWithCount = safeMembers.map((m) => ({
      ...m,
      wishListsCount: countByMemberId.get(m.id) ?? 0,
    }));

    return NextResponse.json(
      {
        familyCode: family.code,
        members: membersWithCount,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[MEMBERS GET] error inesperado:", err);
    return NextResponse.json(
      { message: "Error interno al cargar los miembros.", members: [] },
      { status: 500 }
    );
  }
}

// 🔹 POST: crear nuevo miembro (tu lógica anterior)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { name, pin } = (body as any) ?? {};
    const code = getFamilyCodeFromUrl(req);

    if (!name || !pin) {
      return NextResponse.json({ message: "Datos incompletos." }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json(
        { message: "Código de familia inválido." },
        { status: 400 }
      );
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ message: "PIN inválido." }, { status: 400 });
    }

    // 1) Buscar familia
    const { data: family, error: famError } = await supabaseServer
      .from("families")
      .select("id, code, name")
      .eq("code", code)
      .maybeSingle();

    if (famError || !family) {
      return NextResponse.json({ message: "Familia no encontrada." }, { status: 404 });
    }

    // 2) Hash PIN
    const pin_hash = await bcrypt.hash(pin, 10);

    // 3) Crear miembro
    const { data: member, error: memError } = await supabaseServer
      .from("members")
      .insert({
        family_id: family.id,
        name,
        pin_hash,
      })
      .select("*")
      .single();

    if (memError || !member) {
      console.error(memError);
      return NextResponse.json({ message: "No se pudo crear tu perfil." }, { status: 500 });
    }

    // 4) Crear lista por defecto
    const { data: list, error: listError } = await supabaseServer
      .from("lists")
      .insert({
        family_id: family.id,
        member_id: member.id,
        title: `Lista de regalos de ${name}`,
      })
      .select("*")
      .single();

    if (listError || !list) {
      console.error(listError);
      return NextResponse.json({ message: "No se pudo crear tu lista." }, { status: 500 });
    }

    return NextResponse.json(
      {
        familyCode: family.code,
        member: { id: member.id, name: member.name },
        list: { id: list.id, title: list.title },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[NEW MEMBER] error inesperado:", err);
    return NextResponse.json(
      { message: "Error interno al crear el miembro." },
      { status: 500 }
    );
  }
}
