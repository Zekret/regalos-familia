import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getMemberIdFromUrl(req: NextRequest): string | null {
    const { pathname } = req.nextUrl;
    // /api/members/{memberId}
    const parts = pathname.split("/").filter(Boolean);
    // ["api","members","{memberId}"]
    const memberId = parts[2];
    return memberId || null;
}

export async function GET(req: NextRequest) {
    try {
        const memberId = getMemberIdFromUrl(req);

        if (!memberId) {
            return NextResponse.json({ message: "memberId inválido." }, { status: 400 });
        }

        const { data, error } = await supabaseServer
            .from("members")
            .select("id, name, username, avatar")
            .eq("id", memberId)
            .maybeSingle();

        if (error) {
            console.error("[MEMBER GET] supabase error:", error);
            return NextResponse.json({ message: "No se pudo cargar el miembro." }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ message: "Miembro no encontrado." }, { status: 404 });
        }

        return NextResponse.json(
            {
                member: {
                    id: data.id,
                    name: data.name,
                    username: data.username ?? null,
                    avatar: data.avatar ?? null,
                },
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("[MEMBER GET] error inesperado:", err);
        return NextResponse.json({ message: "Error interno." }, { status: 500 });
    }
}
