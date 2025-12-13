"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/app/f/[code]/perfil/components/Sidebar";
import { MobileNav } from "@/app/f/[code]/perfil/components/MobileNav";

import { WishListDetail } from "@/app/f/[code]/perfil/components/WishListDetail";
import type { AddWishItemPayload } from "@/app/f/[code]/perfil/components/AddWishItemModal";

import { WishItemModal } from "@/app/f/[code]/perfil/components/WishItemModal";
import { useWishItemModal } from "@/app/f/[code]/perfil/hooks/useWishItemModal";

type Session = {
  familyCode: string;
  member: { id: string; name: string };
  token: string;
};

type WishListMeta = {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  creatorUsername: string;
  member_id: string;
  family_code: string;
};

type WishItemUI = {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  url?: string;
  liked: boolean;
  notes?: string;
  priceRaw?: number;
};

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900";

function formatCLP(value: number) {
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${Math.round(value)}`;
  }
}

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return Number(value.replace(/[^\d]/g, "")) || 0;
  return 0;
}

export default function InternalWishListDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { code, userId, listId } = useParams<{ code: string; userId: string; listId: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [meta, setMeta] = useState<WishListMeta | null>(null);
  const [items, setItems] = useState<WishItemUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemModal = useWishItemModal();

  // ✅ Sidebar/Nav en modo "wishes"
  const activeSection = useMemo(() => {
    return pathname.includes("/wishlists") ? "wishes" : "family";
  }, [pathname]);

  // ✅ validar sesión
  useEffect(() => {
    try {
      const raw = localStorage.getItem("gf_session");
      if (!raw) {
        router.replace(`/wishlists/${listId}`);
        return;
      }
      const s = JSON.parse(raw) as Session;
      if (s.familyCode !== code || s.member.id !== userId) {
        router.replace(`/wishlists/${listId}`);
        return;
      }
      setSession(s);
    } catch {
      router.replace(`/wishlists/${listId}`);
    }
  }, [code, userId, listId, router]);

  async function loadAll() {
    const [metaRes, itemsRes] = await Promise.all([
      fetch(`/api/lists/${listId}`),
      fetch(`/api/lists/${listId}/items`),
    ]);

    const metaData = await metaRes.json().catch(() => null);
    const itemsData = await itemsRes.json().catch(() => null);

    if (!metaRes.ok) throw new Error(metaData?.message || "No se pudo cargar la lista.");
    if (!itemsRes.ok) throw new Error(itemsData?.message || "No se pudieron cargar los deseos.");

    // ✅ solo dueño: si no, a público
    if (metaData?.member_id !== userId) {
      router.replace(`/wishlists/${listId}`);
      return;
    }

    setMeta(metaData as WishListMeta);

    const mapped: WishItemUI[] = (itemsData?.items ?? []).map((it: any) => {
      const raw = safeNumber(it.price);
      return {
        id: it.id,
        name: it.name,
        url: it.url ?? undefined,
        liked: true,
        imageUrl: PLACEHOLDER_IMG,
        notes: it.notes ?? "",
        priceRaw: raw,
        price: formatCLP(raw),
      };
    });

    setItems(mapped);
  }

  useEffect(() => {
    if (!listId || !userId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadAll();
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error al cargar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, userId]);

  async function createItem(payload: AddWishItemPayload) {
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudo agregar.");

    const created = data?.item;
    const raw = safeNumber(created?.price ?? payload.price);

    setItems((prev) => [
      {
        id: created?.id ?? crypto.randomUUID(),
        name: created?.name ?? payload.name,
        url: created?.url ?? payload.url,
        liked: true,
        imageUrl: payload.imageUrl ?? PLACEHOLDER_IMG,
        notes: created?.notes ?? payload.notes ?? "",
        priceRaw: raw,
        price: formatCLP(raw),
      },
      ...prev,
    ]);
  }

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleUpdated(updated: any) {
    const raw = safeNumber(updated.price ?? updated.priceRaw);
    const ui: WishItemUI = {
      ...updated,
      priceRaw: raw,
      price: formatCLP(raw),
      imageUrl: updated.imageUrl ?? PLACEHOLDER_IMG,
      liked: true,
    };
    setItems((prev) => prev.map((i) => (i.id === ui.id ? ui : i)));
  }

  const handleLogout = () => {
    localStorage.removeItem("gf_session");
    router.push(`/f/${code}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (error || !meta || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="bg-red-950/40 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-xl">
          {error ?? "No se pudo cargar."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={() => {
          // ✅ aquí NO queremos setState: queremos navegar
          router.push(`/f/${code}/perfil/${userId}?section=family`);
        }}
        memberName={session.member.name}
        familyCode={session.familyCode}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
          <WishListDetail
            listId={listId}
            title={meta.title}
            description={meta.description}
            creatorName={meta.creatorName}
            creatorUsername={meta.creatorUsername}
            items={items}
            showBack
            onBack={() => router.push(`/f/${code}/perfil/${userId}?section=wishes`)}
            canAddItem
            onCreateItem={createItem}
            onItemClick={(item) => itemModal.openModal(item)}
          />

          {itemModal.open && itemModal.item ? (
            <WishItemModal
              item={itemModal.item as any}
              onClose={itemModal.closeModal}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ) : null}
        </div>
      </main>

      <MobileNav
        activeSection={activeSection}
        onSectionChange={() => {
          router.push(`/f/${code}/perfil/${userId}?section=wishes`);
        }}
      />
    </div>
  );
}
