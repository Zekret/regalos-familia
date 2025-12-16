"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { Sidebar } from "@/app/f/[code]/perfil/components/Sidebar";
import { MobileNav } from "@/app/f/[code]/perfil/components/MobileNav";

import { WishListDetail } from "@/app/f/[code]/perfil/components/WishListDetail";

import { WishItemModal } from "@/app/f/[code]/perfil/components/WishItemModal";
import { useWishItemModal } from "@/app/f/[code]/perfil/hooks/useWishItemModal";
import { useWishListData } from "@/app/f/[code]/perfil/hooks/useWishListData";

import {
  EditWishItemModal,
  type EditWishItemPayload,
} from "@/app/f/[code]/perfil/components/EditWishItemModal";

type Session = {
  familyCode: string;
  member: { id: string; name: string };
  token: string;
};

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
  const searchParams = useSearchParams();
  const { code, userId, listId } = useParams<{
    code: string;
    userId: string;
    listId: string;
  }>();

  const [session, setSession] = useState<Session | null>(null);

  const { meta, items, setItems, loading, error } = useWishListData(listId);
  const itemModal = useWishItemModal();

  // ✅ modal editar
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // ✅ Sidebar/Nav en modo "wishes"
  const activeSection = useMemo(() => {
    return pathname.includes("/wishlists") ? "wishes" : "family";
  }, [pathname]);

  const familyHref = `/f/${code}/perfil/${userId}?section=family`;
  const wishesHref = `/f/${code}/perfil/${userId}?section=wishes`;

  // ✅ Default: si no viene ?section= -> wishes
  useEffect(() => {
    const section = searchParams.get("section");
    if (!section) router.replace(`${pathname}?section=wishes`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

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
      body: formData,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudo agregar.");

    const created = data?.item;
    if (!created) return;

    const raw = safeNumber(created.price);
    const createdImageUrl = created?.image_urls?.[0] ?? created?.imageUrl ?? "";

    setItems((prev) => [
      {
        id: created.id,
        name: created.name,
        url: created.url,
        isMostWanted: created.isMostWanted,
        imageUrl: createdImageUrl,
        notes: created.notes ?? "",
        priceRaw: raw,
        price: formatCLP(raw),
      },
      ...prev,
    ]);
  }

  async function editItem(itemId: string, payload: EditWishItemPayload) {
    const hasImage = !!payload.imageFile;
    const wantsRemove = !!payload.removeImage;

    let res: Response;

    const isMostWanted = !!payload.isMostWanted;

    if (hasImage || wantsRemove) {
      const fd = new FormData();
      fd.set("name", payload.name);
      fd.set("notes", payload.notes ?? "");
      fd.set("url", payload.url ?? "");
      fd.set("price", String(payload.price ?? ""));
      fd.set("removeImage", String(!!payload.removeImage));
      if (payload.imageFile) fd.set("image", payload.imageFile);

      fd.set("isMostWanted", isMostWanted ? "true" : "false");

      res = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        body: fd,
      });
    } else {
      res = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          notes: payload.notes ?? null,
          url: payload.url ?? null,
          price: payload.price,
          isMostWanted,
        }),
      });
    }

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudo guardar.");

    const updated = data?.item;
    const raw = safeNumber(updated?.price ?? payload.price);

    const newImageUrl: string = updated?.image_urls?.[0] ?? "";

    const newIsMostWanted: boolean =
      typeof updated?.is_most_wanted === "boolean"
        ? updated.is_most_wanted
        : isMostWanted;

    setItems((prev) =>
      prev.map((it: any) => {
        if (it.id !== itemId) return it;

        return {
          ...it,
          name: updated?.name ?? payload.name,
          notes: updated?.notes ?? payload.notes ?? "",
          url: updated?.url ?? payload.url ?? "",
          imageUrl: newImageUrl || it.imageUrl,
          priceRaw: raw,
          price: formatCLP(raw),
          isMostWanted: newIsMostWanted,
        };
      })
    );

    return { raw, imageUrl: newImageUrl, isMostWanted: newIsMostWanted };
  }


  async function deleteItem(itemId: string) {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || "No se pudo eliminar.");

    setItems((prev) => prev.filter((it: any) => it.id !== itemId));
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
        familyHref={familyHref}
        wishesHref={wishesHref}
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

          {/* ✅ Privado: modal informativo/gestión */}
          {itemModal.open && itemModal.item ? (
            <WishItemModal
              isOpen={itemModal.open}
              item={itemModal.item as any}
              onClose={itemModal.closeModal}
              canManage={true}
              onEdit={() => {
                setEditingItem(itemModal.item);
                setEditOpen(true);
              }}
              onDelete={async () => {
                const it: any = itemModal.item;
                if (!it?.id) return;

                const ok = window.confirm("¿Eliminar este deseo? Esta acción no se puede deshacer.");
                if (!ok) return;

                try {
                  await deleteItem(it.id);
                  itemModal.closeModal();
                } catch (e: any) {
                  alert(e?.message || "No se pudo eliminar.");
                }
              }}
            />
          ) : null}

          {/* ✅ Edit modal */}
          {editOpen && editingItem ? (
            <EditWishItemModal
              isOpen={editOpen}
              item={editingItem}
              onClose={() => {
                setEditOpen(false);
                setEditingItem(null);
              }}
              onSubmit={async (payload) => {
                const it: any = editingItem;
                if (!it?.id) return;

                const result = await editItem(it.id, payload);

                // ✅ refrescar item que usa el EditWishItemModal (misma id)
                setEditingItem((prev: any) => {
                  if (!prev || prev.id !== it.id) return prev;

                  return {
                    ...prev,
                    name: payload.name,
                    notes: payload.notes ?? "",
                    url: payload.url ?? "",
                    priceRaw: result.raw,
                    price: formatCLP(result.raw),
                    imageUrl: result.imageUrl || prev.imageUrl,
                  };
                });

                // ✅ refrescar item en el modal informativo si sigue abierto
                if (itemModal.open && itemModal.item?.id === it.id) {
                  itemModal.openModal({
                    ...itemModal.item,
                    name: payload.name,
                    notes: payload.notes ?? "",
                    url: payload.url ?? "",
                    priceRaw: result.raw,
                    price: formatCLP(result.raw),
                    imageUrl: result.imageUrl || (itemModal.item as any)?.imageUrl,
                  } as any);
                }
              }}
            />
          ) : null}
        </div>
      </main>

      <MobileNav activeSection={activeSection} familyHref={familyHref} wishesHref={wishesHref} />
    </div>
  );
}
