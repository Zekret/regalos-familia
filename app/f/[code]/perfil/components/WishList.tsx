"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Plus, X, LogIn, Share2, Link as LinkIcon, Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ImageWithFallback } from "./ImageWithFallback";
import { UserProfile } from "./UserProfile";

interface WishBoard {
  id: string;
  title: string;
  itemsCount: number;
  imageUrl: string;
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

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1590156221187-1710315f710b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1739132268718-53d64165d29a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1635796436337-50481b9fa2ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1702374114954-9029a74a8add?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

function buildPublicUrlFromPathname(origin: string, memberId: string) {
  return `${origin}/u/${memberId}/wishlists`;
}


export function WishList({
  memberId,
  owner,
  canCreate = false,
  onLogin,
}: WishListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [wishBoards, setWishBoards] = useState<WishBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal crear lista
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canSubmit = useMemo(() => title.trim().length > 0 && !creating, [title, creating]);

  // ✅ Compartir
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? buildPublicUrlFromPathname(window.location.origin, memberId)
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

      // Clipboard
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

  async function fetchLists() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/members/${memberId}/lists`);
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.message || "No se pudieron cargar las listas.");

      const lists: ApiList[] = data?.lists ?? [];

      const mapped: WishBoard[] = lists.map((list, index) => ({
        id: list.id,
        title: list.title,
        itemsCount: list.itemsCount ?? 0,
        imageUrl: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
        liked: true,
      }));

      setWishBoards(mapped);
    } catch (err: any) {
      setError(err.message || "Error al cargar las listas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!memberId) return;
    fetchLists();
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

      setWishBoards((prev) => [
        {
          id: data.list.id,
          title: data.list.title,
          itemsCount: 0,
          imageUrl: FALLBACK_IMAGES[prev.length % FALLBACK_IMAGES.length],
          liked: true,
        },
        ...prev,
      ]);

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
      <div className="max-w-6xl mx-auto">
        {/* Owner */}
        <UserProfile name={owner.name} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-white">Lista de deseos</h2>
              <p className="text-gray-400 mt-1 text-sm">
                {loading
                  ? "Cargando..."
                  : `${wishBoards.length} lista${wishBoards.length === 1 ? "" : "s"} creada${wishBoards.length === 1 ? "" : "s"
                  }`}
              </p>
            </div>
          </div>

          {/* Acciones derecha */}
          <div className="flex gap-2 w-full sm:w-auto">
            {/* ✅ Botón compartir (design) */}
            <button
              type="button"
              onClick={() => setShowShare((v) => !v)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden sm:inline">Compartir</span>
            </button>

            {canCreate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Crear lista
              </button>
            )}
          </div>
        </div>

        {/* ✅ Panel compartir (desplegable) */}
        {showShare && (
          <div className="mb-6 bg-slate-900 border border-slate-700 rounded-xl p-3">
            <p className="font-semibold mb-2 text-gray-100 flex items-center gap-2 text-sm">
              <LinkIcon className="w-4 h-4" />
              Compartir vínculo (vista pública)
            </p>

            <p className="break-all text-gray-100 text-xs bg-slate-950 rounded-lg p-2 border border-slate-700">
              {publicUrl}
            </p>

            <div className="mt-3 flex gap-2">
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
                onClick={() => setShowShare(false)}
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
        )}

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {wishBoards.map((board) => (
              <div
                key={board.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/wishlists/${board.id}`)} // ✅ público/detail
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-gray-900">
                  <ImageWithFallback
                    src={board.imageUrl}
                    alt={board.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                <h3 className="text-white mb-1 leading-tight line-clamp-2">{board.title}</h3>

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
