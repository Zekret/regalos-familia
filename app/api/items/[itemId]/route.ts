// app/api/items/[itemId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getItemIdFromUrl(req: NextRequest): string | null {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean);
    // /api/items/{itemId} -> ["api","items","{itemId}"]
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

export async function PUT(req: NextRequest) {
    try {
        const itemId = getItemIdFromUrl(req);
        if (!itemId) {
            return NextResponse.json({ message: "itemId inválido." }, { status: 400 });
        }

        const body = await req.json().catch(() => null);
        const { name, notes, url, price } = (body as any) ?? {};

        if (!name || !name.trim()) {
            return NextResponse.json(
                { message: "El nombre es obligatorio." },
                { status: 400 }
            );
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
            return NextResponse.json(
                { message: "No se pudo actualizar el deseo." },
                { status: 500 }
            );
        }

        return NextResponse.json({ item: data }, { status: 200 });
    } catch (err) {
        console.error("[ITEM PUT] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al actualizar el deseo." },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const itemId = getItemIdFromUrl(req);
        if (!itemId) {
            return NextResponse.json({ message: "itemId inválido." }, { status: 400 });
        }

        const { error } = await supabaseServer.from("items").delete().eq("id", itemId);

        if (error) {
            console.error("[ITEM DELETE] Supabase error:", error);
            return NextResponse.json(
                { message: "No se pudo eliminar el deseo." },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        console.error("[ITEM DELETE] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al eliminar el deseo." },
            { status: 500 }
        );
    }
}
