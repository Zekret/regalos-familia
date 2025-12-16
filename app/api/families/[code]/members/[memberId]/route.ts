import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getFamilyCodeFromUrl(req: NextRequest): string | null {
    const { pathname } = req.nextUrl;
    const parts = pathname.split("/").filter(Boolean);
    // /api/families/[code]/members/[memberId]
    const rawCode = parts[2];
    if (!rawCode) return null;
    return rawCode.trim().toUpperCase();
}

function getMemberIdFromUrl(req: NextRequest): string | null {
    const { pathname } = req.nextUrl;
    const parts = pathname.split("/").filter(Boolean);
    // ["api","families","[code]","members","[memberId]"]
    const memberId = parts[4];
    return memberId?.trim() || null;
}

export async function GET(req: NextRequest) {
    try {
        const code = getFamilyCodeFromUrl(req);
        const memberId = getMemberIdFromUrl(req);

        if (!code) {
            return NextResponse.json({ message: "Código de familia inválido." }, { status: 400 });
        }

        if (!memberId) {
            return NextResponse.json({ message: "memberId inválido." }, { status: 400 });
        }

        // 1) Buscar familia
        const { data: family, error: famError } = await supabaseServer
            .from("families")
            .select("id, code")
            .eq("code", code)
            .maybeSingle();

        if (famError || !family) {
            return NextResponse.json({ message: "Familia no encontrada." }, { status: 404 });
        }

        // 2) Buscar miembro SOLO dentro de esa familia
        const { data: member, error: memError } = await supabaseServer
            .from("members")
            .select("id, name, created_at")
            .eq("id", memberId)
            .eq("family_id", family.id)
            .maybeSingle();

        if (memError) {
            console.error("[MEMBER GET] memError:", memError);
            return NextResponse.json(
                { message: "No se pudo cargar el miembro." },
                { status: 500 }
            );
        }

        if (!member) {
            return NextResponse.json({ message: "Miembro no encontrado." }, { status: 404 });
        }

        return NextResponse.json({ member }, { status: 200 });
    } catch (err) {
        console.error("[MEMBER GET] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al cargar el miembro." },
            { status: 500 }
        );
    }
}
