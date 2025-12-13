import { NextRequest, NextResponse } from "next/server";
import { fetchUrlPreview } from "@/src/lib/urlPreview";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rawUrl = searchParams.get("url")?.trim();

        if (!rawUrl) {
            return NextResponse.json({ message: "Falta parámetro url." }, { status: 400 });
        }

        let parsed: URL;
        try {
            parsed = new URL(rawUrl);
        } catch {
            return NextResponse.json({ message: "URL inválida." }, { status: 400 });
        }

        if (!["http:", "https:"].includes(parsed.protocol)) {
            return NextResponse.json({ message: "Solo URLs http/https." }, { status: 400 });
        }

        const preview = await fetchUrlPreview(rawUrl);
        return NextResponse.json(preview, { status: 200 });
    } catch {
        return NextResponse.json({ message: "No se pudo generar preview." }, { status: 500 });
    }
}
