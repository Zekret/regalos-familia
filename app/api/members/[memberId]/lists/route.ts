// app/api/members/[memberId]/lists/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getMemberIdFromUrl(req: NextRequest): string | null {
    const { pathname } = req.nextUrl;
    // /api/members/{memberId}/lists
    const parts = pathname.split("/").filter(Boolean);
    // ["api", "members", "{memberId}", "lists"]
    const memberId = parts[2];
    return memberId || null;
}

export async function POST(req: NextRequest) {
    try {
        const memberId = getMemberIdFromUrl(req);

        if (!memberId) {
            return NextResponse.json({ message: "memberId inválido." }, { status: 400 });
        }

        const body = await req.json().catch(() => null);
        const title = body?.title?.toString().trim();
        const description = body?.description?.toString().trim() || null;

        if (!title) {
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
            return NextResponse.json({ message: "Miembro no encontrado." }, { status: 404 });
        }

        // 2) Crear la nueva lista (ahora con description)
        const { data: list, error: listError } = await supabaseServer
            .from("lists")
            .insert({
                family_id: member.family_id,
                member_id: member.id,
                title,
                description,
            })
            .select("id, title, description, created_at")
            .single();

        if (listError || !list) {
            console.error("[NEW LIST] list error:", listError);
            return NextResponse.json({ message: "No se pudo crear la lista." }, { status: 500 });
        }

        return NextResponse.json({ list }, { status: 201 });
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

        // 1) Traer listas del miembro
        const { data: lists, error: listsError } = await supabaseServer
            .from("lists")
            .select("id, title, description, created_at")
            .eq("member_id", memberId)
            .order("created_at", { ascending: true });

        if (listsError) {
            console.error("[LISTS GET] error:", listsError);
            return NextResponse.json(
                { message: "No se pudieron cargar las listas.", lists: [] },
                { status: 500 }
            );
        }

        const safeLists = lists ?? [];

        if (safeLists.length === 0) {
            return NextResponse.json({ lists: [] }, { status: 200 });
        }

        // 2) Contar items por lista (deseos)
        // ⚠️ Cambia "items" si tu tabla de deseos se llama distinto
        const listIds = safeLists.map((l) => l.id);

        const { data: itemsRows, error: itemsError } = await supabaseServer
            .from("items")
            .select("id, list_id")
            .in("list_id", listIds);

        if (itemsError) {
            console.error("[LISTS GET] items error:", itemsError);
            // Si falla el conteo, devolvemos igual las listas con itemsCount = 0
            const fallback = safeLists.map((l) => ({ ...l, itemsCount: 0 }));
            return NextResponse.json({ lists: fallback }, { status: 200 });
        }

        // 3) Armar mapa de conteo
        const countMap: Record<string, number> = {};
        for (const row of itemsRows ?? []) {
            const lid = (row as any).list_id as string;
            if (!lid) continue;
            countMap[lid] = (countMap[lid] ?? 0) + 1;
        }

        // 4) Unir resultado
        const enriched = safeLists.map((l) => ({
            ...l,
            itemsCount: countMap[l.id] ?? 0,
        }));

        return NextResponse.json({ lists: enriched }, { status: 200 });
    } catch (err) {
        console.error("[LISTS GET] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al cargar las listas.", lists: [] },
            { status: 500 }
        );
    }
}
