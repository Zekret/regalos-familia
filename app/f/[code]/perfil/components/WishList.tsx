"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Plus, X, Share2, Link as LinkIcon, Check } from "lucide-react";
import { useRouter } from "next/navigation";

import { UserProfile } from "./UserProfile";
import { WishListImagesPreview, type WishPreviewItem } from "./WishListImagesPreview";

interface WishBoard {
  id: string;
  title: string;
  itemsCount: number;
  liked: boolean;
}

interface ApiList {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  itemsCount?: number;
}

interface WishListProps {
  memberId: string;
  owner: {
    name: string;
    username?: string;
    avatar?: string;
  };
  canCreate?: boolean;
  onLogin?: () => void;
}

type ApiItemsResponse = {
  items: Array<{
    id: string;
    imageUrl: string;
    priceValue?: number;
  }>;
};

function buildPublicUserWishlistsUrl(origin: string, memberId: string) {
  return `${origin}/u/${memberId}/wishlists`;
}

export function WishList({ memberId, owner, canCreate = false }: WishListProps) {
  const router = useRouter();

  const [wishBoards, setWishBoards] = useState<WishBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Mapa listId -> items (para collage real)
  const [listItemsMap, setListItemsMap] = useState<Record<string, WishPreviewItem[]>>({});

  // Modal crear lista
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && !creating,
    [title, creating]
  );

  // ✅ Compartir (FAB + panel)
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? buildPublicUserWishlistsUrl(window.location.origin, memberId)
      : "";

  async function handleSharePublicUrl() {
    if (!publicUrl) return;

    try {
      // Web Share API (mobile)
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: "Lista de deseos",
          text: `Mira las listas de deseos de ${owner?.name || "mi perfil"}`,
          url: publicUrl,
        });
        return;
      }

      // Clipboard fallback
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = publicUrl;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("No se pudo compartir/copiar el enlace. Intenta nuevamente.");
    }
  }

  async function fetchListsWithItems(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);

      // 1) Listas
      const res = await fetch(`/api/members/${memberId}/lists`, { signal });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "No se pudieron cargar las listas.");
      }

      const lists: ApiList[] = data?.lists ?? [];

      const mappedBoards: WishBoard[] = lists.map((list) => ({
        id: list.id,
        title: list.title,
        itemsCount: list.itemsCount ?? 0,
        liked: true,
      }));

      setWishBoards(mappedBoards);

      // 2) Items por lista (limit=3 para collage)
      const itemsResults = await Promise.all(
        lists.map(async (list) => {
          const listId = list.id;
          const count = list.itemsCount ?? 0;

          if (count <= 0) {
            return { listId, items: [] as WishPreviewItem[] };
          }

          const itemsRes = await fetch(`/api/lists/${listId}/items?limit=3`, { signal });
          const itemsJson: ApiItemsResponse | null = await itemsRes.json().catch(() => null);

          if (!itemsRes.ok) {
            return { listId, items: [] as WishPreviewItem[] };
          }

          const items: WishPreviewItem[] = (itemsJson?.items ?? []).map((it) => ({
            id: it.id,
            imageUrl: it.imageUrl,
            price: Number(it.priceValue ?? 0),
          }));

          return { listId, items };
        })
      );

      const nextMap: Record<string, WishPreviewItem[]> = {};
      for (const r of itemsResults) nextMap[r.listId] = r.items;
      setListItemsMap(nextMap);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError(err.message || "Error al cargar las listas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!memberId) return;
    const controller = new AbortController();
    fetchListsWithItems(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  async function createList() {
    if (!canSubmit) return;

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch(`/api/members/${memberId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "No se pudo crear la lista.");

      const newId = data.list.id as string;

      setWishBoards((prev) => [
        {
          id: newId,
          title: data.list.title,
          itemsCount: 0,
          liked: true,
        },
        ...prev,
      ]);

      // lista nueva sin items -> preview placeholder
      setListItemsMap((prev) => ({ ...prev, [newId]: [] }));

      setIsModalOpen(false);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setCreateError(err.message || "Error al crear la lista.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-4 pb-24 md:pb-8 md:p-8">
      {/* ✅ FAB Compartir (top-right, siempre visible) */}
      <button
        type="button"
        onClick={() => setIsShareOpen(true)}
        className="fixed top-6 right-6 md:top-8 md:right-8 flex items-center gap-3 px-5 py-3
                   bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700
                   transition-all hover:scale-105 z-50"
      >
        <Share2 className="w-5 h-5" />
        <span className="hidden sm:inline font-medium">Compartir</span>
      </button>

      {/* ✅ Panel compartir */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setIsShareOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative mt-16 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4"
          >
            <p className="text-white font-semibold flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4" />
              Compartir vínculo
            </p>

            <p className="break-all text-xs text-gray-100 bg-slate-950 rounded-lg p-2 border border-slate-700">
              {publicUrl}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSharePublicUrl}
                className="flex-1 bg-white text-slate-900 rounded-xl py-2.5 hover:bg-gray-100 transition-colors"
              >
                {typeof navigator !== "undefined" && (navigator as any).share
                  ? "Compartir"
                  : "Copiar enlace"}
              </button>

              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="px-4 bg-slate-800 text-gray-100 rounded-xl py-2.5 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Cerrar
              </button>
            </div>

            {copied && (
              <p className="mt-2 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" /> Enlace copiado ✅
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Owner */}
        <UserProfile name={owner.name} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white">Lista de deseos</h2>
              </div>
              <p className="text-gray-400 mt-1 text-sm">
                {loading
                  ? "Cargando..."
                  : `${wishBoards.length} lista${wishBoards.length === 1 ? "" : "s"} creada${wishBoards.length === 1 ? "" : "s"
                  }`}
              </p>
            </div>
          </div>

          {canCreate && (
            <>
              {/* MOBILE */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="sm:hidden w-10 h-10 rounded-full bg-blue-900 text-white
                           flex items-center justify-center shadow-lg hover:opacity-90 transition mt-1"
                aria-label="Crear lista"
                title="Crear lista"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* DESKTOP */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear lista
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-950/40 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && wishBoards.length === 0 && (
          <p className="text-gray-400 text-sm">Todavía no hay listas creadas.</p>
        )}

        {/* Grid */}
        {!loading && !error && wishBoards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {wishBoards.map((board) => (
              <div
                key={board.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/wishlists/${board.id}`)}
              >
                {/* ✅ Preview con imágenes REALES desde /api/lists/{id}/items?limit=3 */}
                <div className="mb-2">
                  <WishListImagesPreview
                    items={listItemsMap[board.id] ?? []}
                    itemsCount={board.itemsCount}
                  />
                </div>

                <h3 className="text-white mb-1 leading-tight line-clamp-2">
                  {board.title}
                </h3>

                <div className="flex items-center gap-2 text-gray-400">
                  <Heart className={`w-3 h-3 ${board.liked ? "fill-pink-500 text-pink-500" : ""}`} />
                  <span className="text-sm">{board.itemsCount} Deseos</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear lista (solo si canCreate) */}
      {canCreate && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={() => !creating && setIsModalOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950">
              <h3 className="text-white font-semibold">Crear lista</h3>

              <button
                type="button"
                onClick={() => !creating && setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-300"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto max-h-[70vh]">
              {createError && (
                <div className="mb-3 bg-red-950/40 border border-red-700 text-red-200 text-sm px-3 py-2 rounded-lg">
                  {createError}
                </div>
              )}

              <div className="space-y-4">
                <input
                  placeholder="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                />

                <textarea
                  placeholder="Descripción (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl bg-slate-900/60 border border-white/10 px-3 py-3 text-white outline-none focus:border-blue-500/60"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-white/10 bg-slate-950">
              <button
                type="button"
                onClick={createList}
                disabled={!canSubmit}
                className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
              >
                {creating ? "Creando..." : "Crear lista"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
