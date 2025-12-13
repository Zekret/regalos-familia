export type UrlPreviewResult = {
    title: string | null;
    image: string | null;
    price: number | null;
    currency: string | null;
    url: string; // url limpia
    source: {
        title: "og" | "twitter" | "title" | "fallback";
        image: "og" | "twitter" | "none";
        price: "meta" | "jsonld" | "none";
    };
};

export function cleanTrackingParams(rawUrl: string) {
    const url = new URL(rawUrl);

    const drop = [
        "fbclid",
        "gclid",
        "dclid",
        "msclkid",
        "igshid",
        "mc_cid",
        "mc_eid",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
    ];

    drop.forEach((k) => url.searchParams.delete(k));
    return url.toString();
}

function normalizeWhitespace(s: string) {
    return s.replace(/\s+/g, " ").trim();
}

function extractMeta(html: string, attr: "property" | "name", key: string) {
    const re = new RegExp(
        `<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']+)["'][^>]*>`,
        "i"
    );
    const match = html.match(re);
    return match?.[1] ? normalizeWhitespace(match[1]) : null;
}

function extractTitleTag(html: string) {
    const match = html.match(/<title[^>]*>\s*([\s\S]*?)\s*<\/title>/i);
    return match?.[1] ? normalizeWhitespace(match[1]) : null;
}

function toAbsUrl(maybeUrl: string, baseUrl: string) {
    try {
        return new URL(maybeUrl, baseUrl).toString();
    } catch {
        return maybeUrl;
    }
}

function parsePriceString(raw: string): number | null {
    const cleaned = raw.replace(/[^\d.,]/g, "").trim();
    if (!cleaned) return null;

    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    const lastSep = Math.max(lastDot, lastComma);

    let normalized = cleaned;

    if (lastSep !== -1) {
        const after = cleaned.slice(lastSep + 1);

        if (after.length === 2) {
            normalized =
                cleaned.slice(0, lastSep).replace(/[.,]/g, "") + "." + after;
        } else {
            normalized = cleaned.replace(/[.,]/g, "");
        }
    }

    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
}

function extractJsonLd(html: string): any[] {
    const scripts: any[] = [];
    const re =
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match: RegExpExecArray | null;

    while ((match = re.exec(html))) {
        const raw = match[1]?.trim();
        if (!raw) continue;
        try {
            scripts.push(JSON.parse(raw));
        } catch {
            // ignorar jsonld roto
        }
    }

    return scripts;
}

function findProductOfferPrice(json: any): { price: number | null; currency: string | null } {
    const offers = json?.offers;
    if (!offers) return { price: null, currency: null };

    const pickOffer = Array.isArray(offers) ? offers[0] : offers;
    const priceRaw = pickOffer?.price ?? pickOffer?.lowPrice ?? null;
    const currency = pickOffer?.priceCurrency ?? null;

    const price = priceRaw != null ? parsePriceString(String(priceRaw)) : null;
    return { price, currency: currency ? String(currency) : null };
}

export async function fetchUrlPreview(rawUrl: string, timeoutMs = 8000): Promise<UrlPreviewResult> {
    const url = cleanTrackingParams(rawUrl);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; RegalosFamiliaPreview/1.0)",
                Accept: "text/html,application/xhtml+xml",
            },
        });

        const html = await res.text();

        // Title
        const ogTitle = extractMeta(html, "property", "og:title");
        const twTitle = extractMeta(html, "name", "twitter:title");
        const titleTag = extractTitleTag(html);

        const title =
            ogTitle ?? twTitle ?? titleTag ?? new URL(url).hostname.replace("www.", "");

        const titleSource: UrlPreviewResult["source"]["title"] =
            ogTitle ? "og" : twTitle ? "twitter" : titleTag ? "title" : "fallback";

        // Image
        const ogImage = extractMeta(html, "property", "og:image");
        const twImage = extractMeta(html, "name", "twitter:image");
        const imageRaw = ogImage ?? twImage ?? null;
        const image = imageRaw ? toAbsUrl(imageRaw, url) : null;

        const imageSource: UrlPreviewResult["source"]["image"] =
            ogImage ? "og" : twImage ? "twitter" : "none";

        // Price (meta)
        const metaPriceCandidates = [
            extractMeta(html, "property", "product:price:amount"),
            extractMeta(html, "property", "og:price:amount"),
            extractMeta(html, "property", "product:price"),
            extractMeta(html, "property", "og:price"),
            extractMeta(html, "name", "twitter:data1"),
        ].filter(Boolean) as string[];

        const metaCurrency =
            extractMeta(html, "property", "product:price:currency") ??
            extractMeta(html, "property", "og:price:currency") ??
            null;

        let price: number | null = null;
        let currency: string | null = metaCurrency ? metaCurrency.toUpperCase() : null;
        let priceSource: UrlPreviewResult["source"]["price"] = "none";

        for (const p of metaPriceCandidates) {
            const parsed = parsePriceString(p);
            if (parsed != null) {
                price = parsed;
                priceSource = "meta";
                break;
            }
        }

        // Price (jsonld)
        if (price == null) {
            const jsonlds = extractJsonLd(html);

            for (const block of jsonlds) {
                const candidates = Array.isArray(block) ? block : [block];

                for (const c of candidates) {
                    const graph = c?.["@graph"];
                    const nodes = Array.isArray(graph) ? graph : [c];

                    for (const node of nodes) {
                        if (!node) continue;

                        if (String(node["@type"] || "").toLowerCase().includes("product")) {
                            const found = findProductOfferPrice(node);
                            if (found.price != null) {
                                price = found.price;
                                currency = found.currency ? found.currency.toUpperCase() : currency;
                                priceSource = "jsonld";
                                break;
                            }
                        }
                    }

                    if (price != null) break;
                }

                if (price != null) break;
            }
        }

        return {
            title: title || null,
            image,
            price,
            currency,
            url,
            source: { title: titleSource, image: imageSource, price: priceSource },
        };
    } catch {
        return {
            title: new URL(url).hostname.replace("www.", ""),
            image: null,
            price: null,
            currency: null,
            url,
            source: { title: "fallback", image: "none", price: "none" },
        };
    } finally {
        clearTimeout(t);
    }
}
