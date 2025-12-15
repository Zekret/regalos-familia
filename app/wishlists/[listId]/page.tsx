"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { WishListDetail } from "@/app/f/[code]/perfil/components/WishListDetail";
import { WishItemModal } from "@/app/f/[code]/perfil/components/WishItemModal";
import { useWishItemModal } from "@/app/f/[code]/perfil/hooks/useWishItemModal";
import { useWishListData } from "@/app/f/[code]/perfil/hooks/useWishListData";
import { FloatingLoginButton } from "@/app/f/[code]/perfil/components/FloatingLoginButton";

type Session = {
    familyCode: string;
    member: { id: string; name: string };
    token: string;
};

export default function PublicWishListPage() {
    const router = useRouter();
    const { listId } = useParams<{ listId: string }>();

    const { meta, items, loading, error } = useWishListData(listId);
    const itemModal = useWishItemModal();

    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("gf_session");
            if (raw) setSession(JSON.parse(raw) as Session);
        } catch {
            setSession(null);
        }
    }, []);

    // ✅ si está logeado y es dueño -> redirigir a vista privada con sidebar
    useEffect(() => {
        if (!meta) return;

        try {
            const raw = localStorage.getItem("gf_session");
            if (!raw) return;

            const s = JSON.parse(raw) as Session;
            const isOwner = s.member.id === meta.member_id && s.familyCode === meta.family_code;

            if (isOwner) {
                router.replace(`/f/${s.familyCode}/perfil/${s.member.id}/wishlists/${meta.id}`);
            }
        } catch {
            // ignore
        }
    }, [meta, router]);

    const showFloating = useMemo(() => {
        if (!meta) return false;
        const isOwner = session?.member?.id === meta.member_id && session?.familyCode === meta.family_code;
        return !isOwner; // invitado o no dueño
    }, [meta, session]);

    if (!listId) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <p className="text-sm text-red-300">listId inválido.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-sm text-gray-400">Cargando...</p>
            </div>
        );
    }

    if (error || !meta) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="bg-red-950/40 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-xl">
                    {error ?? "No se pudo cargar."}
                </div>
            </div>
        );
    }

    return (
        <>
            <WishListDetail
                listId={listId}
                title={meta.title}
                description={meta.description}
                creatorName={meta.creatorName}
                creatorUsername={meta.creatorUsername}
                items={items}
                showBack={false}
                canAddItem={false}
                onItemClick={(item) => itemModal.openModal(item)}
            />

            {itemModal.open && itemModal.item ? (
                <WishItemModal
                    isOpen={itemModal.open}
                    item={itemModal.item as any}
                    onClose={itemModal.closeModal}
                    canManage={false}
                />
            ) : null}

            {/* ✅ Botón flotante (invita a crear perfil / unirse / crear familia) */}
            {showFloating ? (
                <FloatingLoginButton familyCode={meta.family_code} familyName={meta.creatorName ?? "esta familia"} />
            ) : null}
        </>
    );
}
