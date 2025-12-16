// app/api/lists/[listId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getListIdFromUrl(req: NextRequest): string | null {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean);
    // /api/lists/{listId} -> ["api","lists","{listId}"]
    return parts[2] ?? null;
}

function safeString(v: unknown): string | null {
    const s = (v ?? "").toString().trim();
    return s.length ? s : null;
}

export async function GET(req: NextRequest) {
    try {
        const listId = getListIdFromUrl(req);
        if (!listId) {
            return NextResponse.json({ message: "listId inválido." }, { status: 400 });
        }

        const { data, error } = await supabaseServer
            .from("lists")
            .select(
                `
        id,
        title,
        description,
        member_id,
        family_id,
        families:family_id ( code ),
        members:member_id ( name )
      `
            )
            .eq("id", listId)
            .single();

        if (error || !data) {
            console.error("[LIST GET] error:", error);
            return NextResponse.json({ message: "Lista no encontrada." }, { status: 404 });
        }

        const familyCode = (data as any)?.families?.code ?? null;
        const creatorName = (data as any)?.members?.name ?? "Usuario";

        return NextResponse.json(
            {
                id: data.id,
                title: data.title,
                description: data.description ?? "",
                member_id: data.member_id,
                family_code: familyCode,
                creatorName,
                creatorUsername: "",
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("[LIST GET] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al cargar la lista." },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const listId = getListIdFromUrl(req);
        if (!listId) {
            return NextResponse.json({ message: "listId inválido." }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const title = safeString(body?.title);
        const description = (body?.description ?? "").toString().trim();

        if (!title) {
            return NextResponse.json(
                { message: "El nombre de la lista es obligatorio." },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseServer
            .from("lists")
            .update({
                title,
                description,
                updated_at: new Date().toISOString(), // ✅ ya tienes el campo
            })
            .eq("id", listId)
            .select("id,title,description,updated_at") // ✅ incluir updated_at
            .maybeSingle();

        if (error) {
            console.error("[LIST PUT] error:", error);
            return NextResponse.json(
                { message: "Error actualizando la lista.", details: error.message },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json({ message: "Lista no encontrada." }, { status: 404 });
        }

        return NextResponse.json({ list: data }, { status: 200 });
    } catch (err) {
        console.error("[LIST PUT] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al actualizar la lista." },
            { status: 500 }
        );
    }
}
