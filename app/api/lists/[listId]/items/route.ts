import { supabaseServer } from "@/src/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

function getListIdFromUrl(req: NextRequest): string | null {
  const { pathname } = req.nextUrl;
  // /api/lists/6e28eeb3-.../items
  // split → ["", "api", "lists", "6e28eeb3-...", "items"]
  const parts = pathname.split("/").filter(Boolean);
  // ["api", "lists", "6e28eeb3-...", "items"]
  const listId = parts[2];
  return listId || null;
}

export async function GET(req: NextRequest) {
  try {
    const listId = getListIdFromUrl(req);

    console.log("[ITEMS GET] pathname =", req.nextUrl.pathname, "listId =", listId);

    if (!listId) {
      return NextResponse.json(
        { message: "listId inválido.", items: [] },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("items")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[ITEMS GET] Supabase error:", error);
      return NextResponse.json(
        { message: "No se pudieron cargar los regalos.", items: [] },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { items: data || [] },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ITEMS GET] error inesperado:", err);
    return NextResponse.json(
      { message: "Error interno al cargar los regalos.", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const listId = getListIdFromUrl(req);

    console.log("[ITEMS POST] pathname =", req.nextUrl.pathname, "listId =", listId);

    if (!listId) {
      return NextResponse.json(
        { message: "listId inválido." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const { name, notes, url, price } = (body as any) ?? {};

    console.log("[ITEMS POST] body =", body);

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "El nombre del regalo es obligatorio." },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json(
        { message: "El precio es obligatorio y debe ser un número." },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);

    const { data, error } = await supabaseServer
      .from("items")
      .insert({
        list_id: listId,
        name: name.trim(),
        notes: notes?.toString().trim() || null,
        url: url?.toString().trim() || null,
        price: numericPrice,
        status: "available",
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("[ITEMS POST] Supabase error:", error);
      return NextResponse.json(
        { message: "No se pudo agregar el regalo." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { item: data },
      { status: 201 }
    );
  } catch (err) {
    console.error("[ITEMS POST] error inesperado:", err);
    return NextResponse.json(
      { message: "Error interno al agregar el regalo." },
      { status: 500 }
    );
  }
}
