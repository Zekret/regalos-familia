// app/api/lists/[listId]/items/route.ts
import { supabaseServer } from "@/src/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

type UiItem = {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  url?: string;
  liked: boolean;
};

function getListIdFromUrl(req: NextRequest): string | null {
  const { pathname } = req.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  return parts[2] || null; // ["api","lists","{listId}","items"]
}

function formatCLP(value: unknown): string {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(safe);
}

function mapDbItemToUi(row: any): UiItem {
  return {
    id: row.id,
    name: row.name ?? "",
    imageUrl: "", // no existe en tu tabla items
    price: formatCLP(row.price),
    url: row.url ?? undefined,
    liked: true,
  };
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
      .select("id, name, url, price, created_at")
      .eq("list_id", listId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[ITEMS GET] Supabase error:", error);
      return NextResponse.json(
        { message: "No se pudieron cargar los regalos.", items: [] },
        { status: 500 }
      );
    }

    const items: UiItem[] = (data ?? []).map(mapDbItemToUi);
    return NextResponse.json({ items }, { status: 200 });
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
      return NextResponse.json({ message: "listId inválido." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const name = (body?.name ?? "").toString().trim();
    const notes = body?.notes?.toString().trim() || null;
    const url = body?.url?.toString().trim() || null;
    const priceRaw = body?.price;

    if (!name) {
      return NextResponse.json(
        { message: "El nombre del regalo es obligatorio." },
        { status: 400 }
      );
    }

    const numericPrice = Number(priceRaw);
    if (!Number.isFinite(numericPrice)) {
      return NextResponse.json(
        { message: "El precio es obligatorio y debe ser un número." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("items")
      .insert({
        list_id: listId,
        name,
        notes,
        url,
        price: numericPrice,
        status: "available",
      })
      .select("id, name, url, price, created_at")
      .single();

    if (error || !data) {
      console.error("[ITEMS POST] Supabase error:", error);
      return NextResponse.json(
        { message: "No se pudo agregar el regalo." },
        { status: 500 }
      );
    }

    const item: UiItem = mapDbItemToUi(data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[ITEMS POST] error inesperado:", err);
    return NextResponse.json(
      { message: "Error interno al agregar el regalo." },
      { status: 500 }
    );
  }
}
