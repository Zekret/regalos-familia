// app/api/members/[memberId]/lists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getMemberIdFromUrl(req: NextRequest): string | null {
    const { pathname } = req.nextUrl;
    // /api/members/{memberId}/lists
    // split → ["", "api", "members", "{memberId}", "lists"]
    const parts = pathname.split("/").filter(Boolean);
    // ["api", "members", "{memberId}", "lists"]
    const memberId = parts[2];
    return memberId || null;
}

export async function POST(req: NextRequest) {
    try {
        const memberId = getMemberIdFromUrl(req);

        if (!memberId) {
            return NextResponse.json(
                { message: "memberId inválido." },
                { status: 400 }
            );
        }

        const body = await req.json().catch(() => null);
        const { title } = (body as any) ?? {};

        if (!title || !title.trim()) {
            return NextResponse.json(
                { message: "El título de la lista es obligatorio." },
                { status: 400 }
            );
        }

        // 1) Buscar member para obtener family_id
        const { data: member, error: memError } = await supabaseServer
            .from("members")
            .select("id, family_id")
            .eq("id", memberId)
            .maybeSingle();

        if (memError || !member) {
            console.error("[NEW LIST] member error:", memError);
            return NextResponse.json(
                { message: "Miembro no encontrado." },
                { status: 404 }
            );
        }

        // 2) Crear la nueva lista
        const { data: list, error: listError } = await supabaseServer
            .from("lists")
            .insert({
                family_id: member.family_id,
                member_id: member.id,
                title: title.trim(),
            })
            .select("id, title, created_at")
            .single();

        if (listError || !list) {
            console.error("[NEW LIST] list error:", listError);
            return NextResponse.json(
                { message: "No se pudo crear la lista." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { list },
            { status: 201 }
        );
    } catch (err) {
        console.error("[NEW LIST] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al crear la lista." },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const memberId = getMemberIdFromUrl(req);

        if (!memberId) {
            return NextResponse.json(
                { message: "memberId inválido.", lists: [] },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseServer
            .from("lists")
            .select("id, title, created_at")
            .eq("member_id", memberId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("[LISTS GET] error:", error);
            return NextResponse.json(
                { message: "No se pudieron cargar las listas.", lists: [] },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { lists: data ?? [] },
            { status: 200 }
        );
    } catch (err) {
        console.error("[LISTS GET] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al cargar las listas.", lists: [] },
            { status: 500 }
        );
    }
}

