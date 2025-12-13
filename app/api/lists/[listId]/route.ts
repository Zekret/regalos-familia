// app/api/lists/[listId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getListIdFromUrl(req: NextRequest): string | null {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean);
    // /api/lists/{listId} -> ["api","lists","{listId}"]
    return parts[2] ?? null;
}

export async function GET(req: NextRequest) {
    try {
        const listId = getListIdFromUrl(req);
        if (!listId) {
            return NextResponse.json({ message: "listId inválido." }, { status: 400 });
        }

        // Ajusta los campos a tu esquema real
        // lists: id, title, description, member_id, family_id
        // families: code
        // members: name (y si tienes username)
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
            return NextResponse.json(
                { message: "Lista no encontrada." },
                { status: 404 }
            );
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
                creatorUsername: "", // si después tienes username, lo llenas aquí
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
