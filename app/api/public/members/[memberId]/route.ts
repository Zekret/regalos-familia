import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getMemberIdFromUrl(req: NextRequest): string | null {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean);
    // /api/public/members/{memberId}
    // ["api","public","members","{memberId}"]
    return parts[3] ?? null;
}

export async function GET(req: NextRequest) {
    try {
        const memberId = getMemberIdFromUrl(req);

        console.log(
            "[PUBLIC MEMBER GET]",
            req.nextUrl.pathname,
            "memberId:",
            memberId
        );

        if (!memberId) {
            return NextResponse.json(
                { message: "memberId inválido." },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseServer
            .from("members") // ✅ ESTA es tu tabla real
            .select("id, name")
            .eq("id", memberId)
            .single();

        if (error || !data) {
            console.error("[PUBLIC MEMBER GET] not found:", error);
            return NextResponse.json(
                { message: "Miembro no encontrado." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                id: data.id,
                name: data.name,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("[PUBLIC MEMBER GET] error:", err);
        return NextResponse.json(
            { message: "Error interno." },
            { status: 500 }
        );
    }
}
