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

// ✅ helper para boolean (checkbox / json)
function parseBooleanFromUnknown(v: unknown): boolean | null {
    // null => "no vino" (para no pisar si no lo mandas)
    if (v === null || v === undefined) return null;

    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;

    if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        if (!s) return null;
        if (s === "true" || s === "1" || s === "on" || s === "yes") return true;
        if (s === "false" || s === "0" || s === "off" || s === "no") return false;
    }

    return null;
}

// ✅ helper para extraer el path interno del bucket desde una publicUrl de Supabase
function storagePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
    // típico: https://xxxx.supabase.co/storage/v1/object/public/<bucket>/<path>
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return publicUrl.slice(idx + marker.length);
}

export async function PUT(req: NextRequest) {
    try {
        const itemId = getItemIdFromUrl(req);
        if (!itemId) {
            return NextResponse.json({ message: "itemId inválido." }, { status: 400 });
        }

        const contentType = req.headers.get("content-type") || "";
        const isMultipart = contentType.includes("multipart/form-data");

        // permite imagen
        if (isMultipart) {
            const form = await req.formData();

            const name = safeString(form.get("name"));
            const notes = safeString(form.get("notes"));
            const url = safeString(form.get("url"));
            const price = form.get("price");

            const removeImage = String(form.get("removeImage") ?? "false") === "true";
            const image = form.get("image");

            const isMostWanted = parseBooleanFromUnknown(form.get("isMostWanted"));

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

            // ✅ si viene el flag, lo guardamos
            if (isMostWanted !== null) {
                payload.is_most_wanted = isMostWanted;
            }

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

                const { data: publicData } = supabaseServer.storage.from("item-images").getPublicUrl(filePath);
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
        const { name, notes, url, price, isMostWanted } = (body as any) ?? {};

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

        const payload: any = {
            name: name.trim(),
            notes: notes?.toString().trim() || null,
            url: url?.toString().trim() || null,
            price: numericPrice,
        };

        // ✅ NUEVO: actualizar is_most_wanted si viene en el body
        const parsedMostWanted = parseBooleanFromUnknown(isMostWanted);
        if (parsedMostWanted !== null) {
            payload.is_most_wanted = parsedMostWanted;
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
    } catch (err) {
        console.error("[ITEM PUT] error inesperado:", err);
        return NextResponse.json({ message: "Error interno al actualizar el deseo." }, { status: 500 });
    }
}

// ✅ DELETE: eliminar item (y opcionalmente imágenes del bucket)
export async function DELETE(req: NextRequest) {
    try {
        const itemId = getItemIdFromUrl(req);
        if (!itemId) {
            return NextResponse.json({ message: "itemId inválido." }, { status: 400 });
        }

        // 1) Traemos image_urls para cleanup (si existe)
        const { data: existing, error: getErr } = await supabaseServer
            .from("items")
            .select("id, image_urls")
            .eq("id", itemId)
            .maybeSingle();

        if (getErr) {
            console.error("[ITEM DELETE] fetch error:", getErr);
            return NextResponse.json({ message: "No se pudo obtener el deseo." }, { status: 500 });
        }

        if (!existing) {
            return NextResponse.json({ message: "Item no encontrado." }, { status: 404 });
        }

        // 2) (Opcional) borrar archivos del storage
        const bucket = "item-images";
        const urls: string[] = Array.isArray((existing as any).image_urls) ? (existing as any).image_urls : [];

        const pathsToRemove = urls
            .map((u) => (typeof u === "string" ? storagePathFromPublicUrl(u, bucket) : null))
            .filter((p): p is string => Boolean(p));

        if (pathsToRemove.length > 0) {
            const { error: rmErr } = await supabaseServer.storage.from(bucket).remove(pathsToRemove);
            if (rmErr) {
                // No abortamos el delete del item si falla el cleanup
                console.warn("[ITEM DELETE] storage remove warning:", rmErr);
            }
        }

        // 3) borrar el registro del item
        const { error: delErr } = await supabaseServer.from("items").delete().eq("id", itemId);

        if (delErr) {
            console.error("[ITEM DELETE] Supabase delete error:", delErr);
            return NextResponse.json({ message: "No se pudo eliminar el deseo." }, { status: 500 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        console.error("[ITEM DELETE] error inesperado:", err);
        return NextResponse.json({ message: "Error interno al eliminar el deseo." }, { status: 500 });
    }
}
