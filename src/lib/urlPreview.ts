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

        // shares/ref comunes
        "si",
        "spm",
        "ref",
        "ref_src",
        "feature",
        "source",
        "share",
        "shareId",
        "sid",
        "origin",
        "action",

        // reco params ML (no aportan al preview)
        "reco_item_pos",
        "reco_backend",
        "reco_backend_type",
        "reco_client",
        "reco_id",
        "reco_model",
        "c_id",
        "c_uid",
        "da_id",
        "da_position",
        "id_origin",
        "da_sort_algorithm",
        "polycard_client",
        "search_layout",
        "position",
        "type",
        "tracking_id",
    ];

    drop.forEach((k) => url.searchParams.delete(k));

    // ✅ limpia fragment (#...)
    url.hash = "";

    return url.toString();
}

function normalizeWhitespace(s: string) {
    return s.replace(/\s+/g, " ").trim();
}

/** ✅ Parser robusto: no depende del orden property/name/content */
function parseTagAttributes(tag: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const re = /(\w[\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(tag))) {
        const key = m[1].toLowerCase();
        const val = (m[2] ?? m[3] ?? m[4] ?? "").trim();
        attrs[key] = val;
    }
    return attrs;
}

function extractMeta(html: string, attr: "property" | "name", key: string) {
    const targetKey = key.toLowerCase();
    const targetAttr = attr.toLowerCase();

    const re = /<meta\b[^>]*>/gi;
    let m: RegExpExecArray | null;

    while ((m = re.exec(html))) {
        const tag = m[0];
        const attrs = parseTagAttributes(tag);

        const a = (attrs[targetAttr] ?? "").toLowerCase();
        const content = attrs["content"];

        if (a === targetKey && content) {
            return normalizeWhitespace(content);
        }
    }

    return null;
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

function findProductOfferPrice(json: any): {
    price: number | null;
    currency: string | null;
} {
    const offers = json?.offers;
    if (!offers) return { price: null, currency: null };

    const pickOffer = Array.isArray(offers) ? offers[0] : offers;
    const priceRaw = pickOffer?.price ?? pickOffer?.lowPrice ?? null;
    const currency = pickOffer?.priceCurrency ?? null;

    const price = priceRaw != null ? parsePriceString(String(priceRaw)) : null;
    return { price, currency: currency ? String(currency) : null };
}

/* ------------------------------------------------------------------ */
/* ✅ MercadoLibre helpers (API fallback)                               */
/* ------------------------------------------------------------------ */

function isMercadoLibre(urlStr: string) {
    try {
        const u = new URL(urlStr);
        const host = u.hostname.replace(/^www\./, "");
        return host === "mercadolibre.cl" || host.endsWith(".mercadolibre.cl");
    } catch {
        return false;
    }
}

function pickMercadoLibreIds(rawUrl: string): {
    itemId: string | null;
    productId: string | null;
    canonicalUrl: string;
} {
    // OJO: para extraer wid del hash/query NO podemos confiar solo en cleanTrackingParams
    // porque cleanTrackingParams limpia el hash (correcto para guardar), pero acá necesitamos leerlo.
    let original: URL | null = null;
    try {
        original = new URL(rawUrl);
    } catch {
        original = null;
    }

    const cleaned = (() => {
        try {
            return cleanTrackingParams(rawUrl);
        } catch {
            return rawUrl;
        }
    })();

    try {
        const url = new URL(cleaned);

        // itemId directo en path: /MLC1706170179
        const pathItem = url.pathname.match(/\/(MLC\d{6,})/i)?.[1] ?? null;

        // productId tipo /p/MLC61403702 o /.../p/MLC61403702
        const pathProduct = url.pathname.match(/\/p\/(MLC\d{6,})/i)?.[1] ?? null;

        // itemId desde pdp_filters=item_id:MLC...
        const pdp = url.searchParams.get("pdp_filters") ?? "";
        const fromPdp = pdp.match(/item_id:([A-Z0-9]+)/i)?.[1] ?? null;

        // ✅ wid puede venir en query o hash (en tus ejemplos viene en hash)
        const widFromQuery =
            (original?.searchParams.get("wid") ?? url.searchParams.get("wid")) || null;

        const widFromHash =
            (original?.hash ?? "").match(/(?:^|[&#])wid=([A-Z0-9]+)/i)?.[1] ?? null;

        // ✅ PRIORIDAD: wid (item real) > path item > pdp_filters > null
        const itemId =
            (widFromQuery ?? widFromHash ?? pathItem ?? fromPdp)?.toUpperCase() ?? null;

        const productId = (pathProduct ?? null)?.toUpperCase() ?? null;

        // canonical: si hay itemId => /{itemId}
        if (itemId) {
            url.pathname = `/${itemId}`;
            url.search = "";
            url.hash = "";
            return { itemId, productId, canonicalUrl: url.toString() };
        }

        // canonical: si hay productId => /p/{productId}
        if (productId) {
            url.pathname = `/p/${productId}`;
            url.search = "";
            url.hash = "";
            return { itemId: null, productId, canonicalUrl: url.toString() };
        }

        url.hash = "";
        return { itemId: null, productId: null, canonicalUrl: url.toString() };
    } catch {
        return { itemId: null, productId: null, canonicalUrl: cleaned };
    }
}

async function fetchJson<T>(
    url: string,
    signal: AbortSignal
): Promise<T | null> {
    try {
        const res = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal,
            headers: {
                Accept: "application/json",
                "User-Agent":
                    "Mozilla/5.0 (compatible; RegalosFamiliaPreview/3.0)",
            },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

type MeliItem = {
    id?: string;
    title?: string;
    currency_id?: string;
    price?: number;
    permalink?: string;
    thumbnail?: string;
    pictures?: Array<{ url?: string; secure_url?: string }>;
};

type MeliProduct = {
    id?: string;
    name?: string;
    buy_box_winner?: {
        item_id?: string;
        price?: number;
        currency_id?: string;
    };
    pictures?: Array<{ url?: string; secure_url?: string }>;
};

function pickBestMeliImageFromItem(item: MeliItem): string | null {
    return (
        item?.pictures?.[0]?.secure_url ??
        item?.pictures?.[0]?.url ??
        item?.thumbnail ??
        null
    );
}

function pickBestMeliImageFromProduct(prod: MeliProduct): string | null {
    return (
        prod?.pictures?.[0]?.secure_url ??
        prod?.pictures?.[0]?.url ??
        null
    );
}

async function fetchMercadoLibrePreview(
    rawUrl: string,
    controller: AbortController
): Promise<UrlPreviewResult | null> {
    const { itemId, productId, canonicalUrl } = pickMercadoLibreIds(rawUrl);

    // ✅ 1) SIEMPRE primero items/{itemId} cuando exista (wid suele ser esto)
    if (itemId) {
        const item = await fetchJson<MeliItem>(
            `https://api.mercadolibre.com/items/${itemId}`,
            controller.signal
        );

        if (item?.title) {
            return {
                title: item.title ?? null,
                image: pickBestMeliImageFromItem(item),
                price: typeof item.price === "number" ? item.price : null,
                currency: item.currency_id ? String(item.currency_id) : null,
                url: item.permalink ?? canonicalUrl,
                source: { title: "fallback", image: "none", price: "none" },
            };
        }
    }

    // 2) si solo hay product => products/{id} y buscar buy_box_winner
    if (productId) {
        const prod = await fetchJson<MeliProduct>(
            `https://api.mercadolibre.com/products/${productId}`,
            controller.signal
        );

        const winnerItemId = prod?.buy_box_winner?.item_id ?? null;

        if (winnerItemId) {
            const item = await fetchJson<MeliItem>(
                `https://api.mercadolibre.com/items/${winnerItemId}`,
                controller.signal
            );

            if (item?.title) {
                return {
                    title: item.title ?? prod?.name ?? null,
                    image:
                        pickBestMeliImageFromItem(item) ?? pickBestMeliImageFromProduct(prod),
                    price:
                        typeof item.price === "number"
                            ? item.price
                            : typeof prod?.buy_box_winner?.price === "number"
                                ? prod.buy_box_winner.price
                                : null,
                    currency:
                        item.currency_id
                            ? String(item.currency_id)
                            : prod?.buy_box_winner?.currency_id
                                ? String(prod.buy_box_winner.currency_id)
                                : null,
                    url: item.permalink ?? canonicalUrl,
                    source: { title: "fallback", image: "none", price: "none" },
                };
            }
        }

        // fallback con lo que venga del producto
        if (prod?.name) {
            return {
                title: prod.name ?? null,
                image: pickBestMeliImageFromProduct(prod),
                price:
                    typeof prod?.buy_box_winner?.price === "number"
                        ? prod.buy_box_winner.price
                        : null,
                currency: prod?.buy_box_winner?.currency_id
                    ? String(prod.buy_box_winner.currency_id)
                    : null,
                url: canonicalUrl,
                source: { title: "fallback", image: "none", price: "none" },
            };
        }
    }

    return null;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export async function fetchUrlPreview(
    rawUrl: string,
    timeoutMs = 8000
): Promise<UrlPreviewResult> {
    const url = cleanTrackingParams(rawUrl);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // ✅ MercadoLibre por API (más confiable que HTML)
        if (isMercadoLibre(rawUrl)) {
            const meli = await fetchMercadoLibrePreview(rawUrl, controller);
            if (meli) return meli;
            // si por alguna razón falla, cae al scraping normal
        }

        const res = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: controller.signal,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml",
                "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
            },
        });

        const html = await res.text();

        // Title
        const ogTitle = extractMeta(html, "property", "og:title");
        const twTitle = extractMeta(html, "name", "twitter:title");
        const titleTag = extractTitleTag(html);

        const title =
            ogTitle ?? twTitle ?? titleTag ?? new URL(url).hostname.replace("www.", "");

        const titleSource: UrlPreviewResult["source"]["title"] = ogTitle
            ? "og"
            : twTitle
                ? "twitter"
                : titleTag
                    ? "title"
                    : "fallback";

        // Image
        const ogImage = extractMeta(html, "property", "og:image");
        const twImage = extractMeta(html, "name", "twitter:image");
        const imageRaw = ogImage ?? twImage ?? null;
        const image = imageRaw ? toAbsUrl(imageRaw, url) : null;

        const imageSource: UrlPreviewResult["source"]["image"] = ogImage
            ? "og"
            : twImage
                ? "twitter"
                : "none";

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
