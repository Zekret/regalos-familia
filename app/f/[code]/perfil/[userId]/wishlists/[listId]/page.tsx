"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { Sidebar } from "@/app/f/[code]/perfil/components/Sidebar";
import { MobileNav } from "@/app/f/[code]/perfil/components/MobileNav";

import { WishListDetail } from "@/app/f/[code]/perfil/components/WishListDetail";

import { WishItemModal } from "@/app/f/[code]/perfil/components/WishItemModal";
import { useWishItemModal } from "@/app/f/[code]/perfil/hooks/useWishItemModal";
import { useWishListData } from "@/app/f/[code]/perfil/hooks/useWishListData";

type Session = {
  familyCode: string;
  member: { id: string; name: string };
  token: string;
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

  const { meta, items, setItems, loading, error } = useWishListData(listId);
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

  // ✅ solo dueño: si no, a público
  useEffect(() => {
    if (!meta) return;
    if (meta.member_id !== userId) {
      router.replace(`/wishlists/${listId}`);
    }
  }, [meta, userId, listId, router]);

  async function createItem(formData: FormData) {
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      body: formData, // ✅ CLAVE
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudo agregar.");

    const created = data?.item;
    if (!created) return;

    const raw = safeNumber(created.price);

    setItems((prev) => [
      {
        id: created.id,
        name: created.name,
        url: created.url,
        liked: true,
        // ✅ ahora SIEMPRE viene desde backend (storage o default)
        imageUrl: created.imageUrl,
        notes: created.notes ?? "",
        priceRaw: raw,
        price: formatCLP(raw),
      },
      ...prev,
    ]);
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

          {/* ✅ Privado: modal con gestión */}
          {itemModal.open && itemModal.item ? (
            <WishItemModal
              item={itemModal.item as any}
              onClose={itemModal.closeModal}
              canManage={true}
              // ⚠️ Aquí conecta tus handlers reales de editar/eliminar
              // (si ya tienes otro modal de edición/borrado, dispara eso desde acá)
              onEdit={() => {
                // TODO: conectar edición real
              }}
              onDelete={() => {
                // TODO: conectar borrado real
              }}
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
