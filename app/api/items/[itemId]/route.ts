// app/api/items/[itemId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getItemIdFromUrl(req: NextRequest): string | null {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean);
    return parts[2] ?? null;
}

function safeNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
        const cleaned = value.replace(/[^\d]/g, "");
        if (!cleaned) return null;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function safeString(v: unknown): string | null {
    const s = (v ?? "").toString().trim();
    return s.length ? s : null;
}

export async function PUT(req: NextRequest) {
    try {
        const itemId = getItemIdFromUrl(req);
        if (!itemId) {
            return NextResponse.json({ message: "itemId inválido." }, { status: 400 });
        }

        const contentType = req.headers.get("content-type") || "";
        const isMultipart = contentType.includes("multipart/form-data");

        // ✅ MULTIPART: permite imagen
        if (isMultipart) {
            const form = await req.formData();

            const name = safeString(form.get("name"));
            const notes = safeString(form.get("notes"));
            const url = safeString(form.get("url"));
            const price = form.get("price");

            const removeImage = String(form.get("removeImage") ?? "false") === "true";
            const image = form.get("image");

            if (!name) {
                return NextResponse.json({ message: "El nombre es obligatorio." }, { status: 400 });
            }

            const numericPrice = safeNumber(price);
            if (numericPrice === null) {
                return NextResponse.json(
                    { message: "El precio es obligatorio y debe ser numérico." },
                    { status: 400 }
                );
            }

            // armamos payload base
            const payload: any = {
                name,
                notes,
                url,
                price: numericPrice,
            };

            // ✅ Si pidió quitar imagen => image_urls = []
            if (removeImage) {
                payload.image_urls = [];
            }

            // ✅ Si viene archivo => subimos y reemplazamos image_urls = [publicUrl]
            if (image && image instanceof File && image.size > 0) {
                if (!image.type.startsWith("image/")) {
                    return NextResponse.json({ message: "El archivo debe ser una imagen." }, { status: 400 });
                }

                const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
                const filePath = `items/${itemId}/${crypto.randomUUID()}.${ext}`;

                const arrayBuffer = await image.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer); 

                const { error: uploadError } = await supabaseServer.storage
                    .from("item-images") 
                    .upload(filePath, bytes, {
                        contentType: image.type,
                        upsert: true,
                    });

                if (uploadError) {
                    console.error("[ITEM PUT] storage upload error:", uploadError);
                    return NextResponse.json({ message: "No se pudo subir la imagen." }, { status: 500 });
                }

                const { data: publicData } = supabaseServer.storage
                    .from("item-images")
                    .getPublicUrl(filePath);

                const publicUrl = publicData?.publicUrl ?? null;

                // ✅ guarda como array (reemplaza)
                payload.image_urls = publicUrl ? [publicUrl] : [];
            }

            const { data, error } = await supabaseServer
                .from("items")
                .update(payload)
                .eq("id", itemId)
                .select("*")
                .single();

            if (error || !data) {
                console.error("[ITEM PUT] Supabase error:", error);
                return NextResponse.json({ message: "No se pudo actualizar el deseo." }, { status: 500 });
            }

            return NextResponse.json({ item: data }, { status: 200 });
        }

        // ✅ JSON: sin imagen (compatibilidad)
        const body = await req.json().catch(() => null);
        const { name, notes, url, price } = (body as any) ?? {};

        if (!name || !name.trim()) {
            return NextResponse.json({ message: "El nombre es obligatorio." }, { status: 400 });
        }

        const numericPrice = safeNumber(price);
        if (numericPrice === null) {
            return NextResponse.json(
                { message: "El precio es obligatorio y debe ser numérico." },
                { status: 400 }
            );
        }

        const payload = {
            name: name.trim(),
            notes: notes?.toString().trim() || null,
            url: url?.toString().trim() || null,
            price: numericPrice,
        };

        const { data, error } = await supabaseServer
            .from("items")
            .update(payload)
            .eq("id", itemId)
            .select("*")
            .single();

        if (error || !data) {
            console.error("[ITEM PUT] Supabase error:", error);
            return NextResponse.json({ message: "No se pudo actualizar el deseo." }, { status: 500 });
        }

        return NextResponse.json({ item: data }, { status: 200 });
    } catch (err) {
        console.error("[ITEM PUT] error inesperado:", err);
        return NextResponse.json({ message: "Error interno al actualizar el deseo." }, { status: 500 });
    }
}
