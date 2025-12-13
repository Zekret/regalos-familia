// src/lib/storage.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export const ITEM_IMAGES_BUCKET = "item-images";
export const DEFAULT_ITEM_IMAGE_PATH = "default.jpg";

/**
 * Construye la URL pública del default.jpg del bucket.
 * (Bucket debe ser PUBLIC)
 */
export function getDefaultItemImageUrl() {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;

    return `${base}/storage/v1/object/public/${ITEM_IMAGES_BUCKET}/${DEFAULT_ITEM_IMAGE_PATH}`;
}

function guessExtFromContentType(contentType?: string | null) {
    const ct = (contentType ?? "").toLowerCase();
    if (ct.includes("png")) return "png";
    if (ct.includes("webp")) return "webp";
    if (ct.includes("gif")) return "gif";
    if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
    return "jpg";
}

export function buildItemImagePath(params: {
    listId: string;
    itemId: string;
    index: number;
    ext?: string;
}) {
    const ext = (params.ext ?? "jpg").replace(".", "");
    return `lists/${params.listId}/items/${params.itemId}/${params.index}.${ext}`;
}

export async function uploadArrayBufferToPublicBucket(params: {
    supabase: SupabaseClient;
    bucket?: string;
    path: string;
    buffer: ArrayBuffer;
    contentType?: string;
    upsert?: boolean;
}) {
    const {
        supabase,
        bucket = ITEM_IMAGES_BUCKET,
        path,
        buffer,
        contentType = "image/jpeg",
        upsert = true,
    } = params;

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
        contentType,
        upsert,
        cacheControl: "3600",
    });

    if (error) throw new Error(`Storage upload error: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

export async function uploadFileToItemImages(params: {
    supabase: SupabaseClient;
    listId: string;
    itemId: string;
    index: number;
    file: File;
}) {
    const { supabase, listId, itemId, index, file } = params;

    const buffer = await file.arrayBuffer();
    const ext = guessExtFromContentType(file.type);
    const path = buildItemImagePath({ listId, itemId, index, ext });

    return uploadArrayBufferToPublicBucket({
        supabase,
        path,
        buffer,
        contentType: file.type || "image/jpeg",
    });
}

/**
 * Descarga una imagen externa (preview) y la sube a storage
 */
export async function uploadExternalImageToItemImages(params: {
    supabase: SupabaseClient;
    listId: string;
    itemId: string;
    index?: number;
    imageUrl: string;
}) {
    const { supabase, listId, itemId, imageUrl } = params;
    const index = params.index ?? 0;

    const res = await fetch(imageUrl);
    if (!res.ok) {
        throw new Error(`No se pudo descargar la imagen externa (${res.status}).`);
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.toLowerCase().startsWith("image/")) {
        throw new Error("La URL no apunta a una imagen válida.");
    }

    const buffer = await res.arrayBuffer();
    const ext = guessExtFromContentType(contentType);
    const path = buildItemImagePath({ listId, itemId, index, ext });

    return uploadArrayBufferToPublicBucket({
        supabase,
        path,
        buffer,
        contentType,
    });
}
