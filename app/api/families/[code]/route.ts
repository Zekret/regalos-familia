// app/api/families/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabaseServer";

function getFamilyCodeFromUrl(req: NextRequest): string | null {
    const { pathname } = req.nextUrl;
    // /api/families/DAY198
    // split → ["", "api", "families", "DAY198"]
    const parts = pathname.split("/").filter(Boolean);
    // ["api", "families", "DAY198"]
    const code = parts[2];
    return code || null;
}

export async function GET(req: NextRequest) {
    try {
        const familyCode = getFamilyCodeFromUrl(req);

        console.log(
            "[FAMILY GET] pathname =",
            req.nextUrl.pathname,
            "familyCode =",
            familyCode
        );

        if (!familyCode) {
            // si no logramos obtenerlo, mejor 400 explícito
            return NextResponse.json(
                { message: "Código de familia inválido." },
                { status: 400 }
            );
        }

        const { data: family, error } = await supabaseServer
            .from("families")
            .select("id, name, code, created_at")
            .eq("code", familyCode)
            .single();

        if (error || !family) {
            console.error("[FAMILY GET] Supabase error:", error);
            return NextResponse.json(
                { message: "Familia no encontrada." },
                { status: 404 }
            );
        }

        return NextResponse.json(family, { status: 200 });
    } catch (err) {
        console.error("[FAMILY GET] error inesperado:", err);
        return NextResponse.json(
            { message: "Error interno al obtener la familia." },
            { status: 500 }
        );
    }
}
