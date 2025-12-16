// app/api/lists/[listId]/items/route.ts
import { supabaseServer } from "@/src/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

import {
  getDefaultItemImageUrl,
  uploadExternalImageToItemImages,
  uploadFileToItemImages,
} from "@/src/lib/storage";

type UiItem = {
  id: string;
  name: string;
  notes: string;
  imageUrl: string; // NUNCA vacío (usa default)
  price: string; // CLP formateado
  priceValue: number; // número real
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

function pickPrimaryImageUrl(row: any) {
  const fromArray = Array.isArray(row?.image_urls) ? row.image_urls[0] : null;
  const def = getDefaultItemImageUrl();
  return (fromArray || def || "").toString();
}

function mapDbItemToUi(row: any): UiItem {
  const numericPrice = Number(row.price ?? 0);
  const safePrice = Number.isFinite(numericPrice) ? numericPrice : 0;

  return {
    id: row.id,
    name: row.name ?? "",
    notes: row.notes ?? "",
    imageUrl: pickPrimaryImageUrl(row),
    price: formatCLP(row.price),
    priceValue: safePrice,
    url: row.url ?? undefined,
    liked: true,
  };
}

export async function GET(req: NextRequest) {
  try {
    const listId = getListIdFromUrl(req);

    console.log(
      "[ITEMS GET] pathname =",
      req.nextUrl.pathname,
      "listId =",
      listId
    );

    if (!listId) {
      return NextResponse.json(
        { message: "listId inválido.", items: [] },
        { status: 400 }
      );
    }

    // ✅ FIX: solo aplicar limit si viene en la URL
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");

    let limit: number | null = null;
    if (limitParam !== null) {
      const parsed = Number(limitParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(50, parsed);
      }
    }

    let query = supabaseServer
      .from("items")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: true });

    if (limit !== null) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

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

async function parseRequestBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    const name = (formData.get("name") ?? "").toString().trim();
    const notes = (formData.get("notes") ?? "").toString().trim() || null;
    const url = (formData.get("url") ?? "").toString().trim() || null;
    const priceRaw = formData.get("price");
    const scrapedImageUrl =
      (formData.get("scrapedImage") ?? "").toString().trim() || null;

    const files = formData.getAll("files").filter(Boolean) as File[];

    return { name, notes, url, priceRaw, scrapedImageUrl, files };
  }

  const body = await req.json().catch(() => null);

  const name = (body?.name ?? "").toString().trim();
  const notes = body?.notes?.toString().trim() || null;
  const url = body?.url?.toString().trim() || null;
  const priceRaw = body?.price;

  const scrapedImageUrl = body?.imageUrl?.toString().trim() || null;

  return { name, notes, url, priceRaw, scrapedImageUrl, files: [] as File[] };
}

export async function POST(req: NextRequest) {
  try {
    const listId = getListIdFromUrl(req);

    console.log(
      "[ITEMS POST] pathname =",
      req.nextUrl.pathname,
      "listId =",
      listId
    );

    if (!listId) {
      return NextResponse.json({ message: "listId inválido." }, { status: 400 });
    }

    const { name, notes, url, priceRaw, scrapedImageUrl, files } =
      await parseRequestBody(req);

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

    const { data: created, error: createError } = await supabaseServer
      .from("items")
      .insert({
        list_id: listId,
        name,
        notes,
        url,
        price: numericPrice,
        status: "available",
        image_urls: [],
      })
      .select("id, name, url, price, created_at, image_urls")
      .single();

    if (createError || !created) {
      console.error("[ITEMS POST] Supabase error:", createError);
      return NextResponse.json(
        { message: "No se pudo agregar el regalo." },
        { status: 500 }
      );
    }

    const itemId = created.id as string;

    const imageUrls: string[] = [];

    if (files && files[0]) {
      const file = files[0];
      const publicUrl = await uploadFileToItemImages({
        supabase: supabaseServer,
        listId,
        itemId,
        index: 0,
        file,
      });
      imageUrls.push(publicUrl);
    }

    if (imageUrls.length === 0 && scrapedImageUrl) {
      try {
        const publicUrl = await uploadExternalImageToItemImages({
          supabase: supabaseServer,
          listId,
          itemId,
          index: 0,
          imageUrl: scrapedImageUrl,
        });
        imageUrls.push(publicUrl);
      } catch (e: any) {
        console.error("[ITEMS POST] upload preview error:", e?.message || e);
      }
    }

    if (imageUrls.length === 0) {
      const def = getDefaultItemImageUrl();
      if (def) imageUrls.push(def);
    }

    const { data: updated, error: updError } = await supabaseServer
      .from("items")
      .update({ image_urls: imageUrls })
      .eq("id", itemId)
      .select("id, name, url, price, created_at, image_urls")
      .single();

    if (updError || !updated) {
      console.error("[ITEMS POST] update image_urls error:", updError);
      const fallbackItem = mapDbItemToUi({ ...created, image_urls: imageUrls });
      return NextResponse.json({ item: fallbackItem }, { status: 201 });
    }

    const item: UiItem = mapDbItemToUi(updated);
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    console.error("[ITEMS POST] error inesperado:", err);
    return NextResponse.json(
      { message: "Error interno al agregar el regalo." },
      { status: 500 }
    );
  }
}
