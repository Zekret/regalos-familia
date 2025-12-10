// app/api/families/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/src/lib/supabaseServer";

type Body = {
  familyName: string;
  memberName: string;
  pin: string;
};

function generateFamilyCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  let code = "";
  for (let i = 0; i < 3; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 3; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)];
  }
  return code;
}

// GET /api/families?page=1&pageSize=20
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    const page = Math.max(1, Number(pageParam) || 1);
    const pageSize = Math.min(
      50, // límite “sano”
      Math.max(1, Number(pageSizeParam) || 20)
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabaseServer
      .from("families")
      .select("id, name, code, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { message: "Error al obtener las familias." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        items: data ?? [],
        page,
        pageSize,
        total: count ?? 0,
        hasMore: count ? to + 1 < count : false,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Error interno al obtener las familias." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { familyName, memberName, pin } = body;

    if (!familyName || !memberName || !pin) {
      return NextResponse.json(
        { message: "Datos incompletos." },
        { status: 400 }
      );
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { message: "PIN inválido." },
        { status: 400 }
      );
    }

    const code = generateFamilyCode();

    // 1) Crear familia
    const { data: family, error: famError } = await supabaseServer
      .from("families")
      .insert({
        name: familyName,
        code,
      })
      .select("*")
      .single();

    if (famError || !family) {
      console.error(famError);
      return NextResponse.json(
        { message: "Error al crear la familia." },
        { status: 500 }
      );
    }

    // 2) Hash del PIN
    const pin_hash = await bcrypt.hash(pin, 10);

    // 3) Crear miembro
    const { data: member, error: memError } = await supabaseServer
      .from("members")
      .insert({
        family_id: family.id,
        name: memberName,
        pin_hash,
      })
      .select("*")
      .single();

    if (memError || !member) {
      console.error(memError);
      return NextResponse.json(
        { message: "Error al crear tu perfil." },
        { status: 500 }
      );
    }

    // 4) Crear lista de ese miembro
    const { data: list, error: listError } = await supabaseServer
      .from("lists")
      .insert({
        family_id: family.id,
        member_id: member.id,
        title: `Lista de regalos de ${memberName}`,
      })
      .select("*")
      .single();

    if (listError || !list) {
      console.error(listError);
      return NextResponse.json(
        { message: "Error al crear tu lista." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        family: {
          id: family.id,
          name: family.name,
          code: family.code,
        },
        member: {
          id: member.id,
          name: member.name,
          role: "admin",
        },
        list: {
          id: list.id,
          title: list.title,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Error interno al crear la familia." },
      { status: 500 }
    );
  }
}
