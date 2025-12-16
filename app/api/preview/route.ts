import { NextRequest, NextResponse } from "next/server";
import { fetchUrlPreview } from "@/src/lib/urlPreview";

export const runtime = "nodejs"; // ✅ más estable para fetch externos
export const dynamic = "force-dynamic"; // ✅ evita cache del route en Next

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rawUrl = searchParams.get("url")?.trim();

        if (!rawUrl) {
            return NextResponse.json(
                { message: "Falta parámetro url." },
                { status: 400 }
            );
        }

        let parsed: URL;
        try {
            parsed = new URL(rawUrl);
        } catch {
            return NextResponse.json({ message: "URL inválida." }, { status: 400 });
        }

        if (!["http:", "https:"].includes(parsed.protocol)) {
            return NextResponse.json(
                { message: "Solo URLs http/https." },
                { status: 400 }
            );
        }

        // ✅ timeout duro del endpoint (por si el preview se cuelga)
        const previewPromise = fetchUrlPreview(rawUrl, 8000);
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout analizando URL")), 9000)
        );

        const preview = await Promise.race([previewPromise, timeoutPromise]);

        return NextResponse.json(preview, {
            status: 200,
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        });
    } catch (e) {
        return NextResponse.json(
            { message: "No se pudo generar preview." },
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store, max-age=0",
                },
            }
        );
    }
}
