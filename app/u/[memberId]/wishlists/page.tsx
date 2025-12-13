"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WishList } from "@/app/f/[code]/perfil/components/WishList";

type Session = {
    familyCode: string;
    member: { id: string; name: string };
    token: string;
};

type Owner = {
    name: string;
    username?: string;
    avatar?: string;
};

export default function PublicWishListsPage() {
    const router = useRouter();
    const pathname = usePathname();

    // /u/{memberId}/wishlists -> ["u","{memberId}","wishlists"]
    const segments = pathname.split("/").filter(Boolean);
    const memberId = segments[1] || "";

    const [owner, setOwner] = useState<Owner>({ name: "Usuario" });
    const [loadingOwner, setLoadingOwner] = useState(true);

    useEffect(() => {
        if (!memberId) return;

        // 1) si está logeado y es el dueño → redirigir a vista interna con sidebar
        try {
            const raw = localStorage.getItem("gf_session");
            if (raw) {
                const session = JSON.parse(raw) as Session;

                if (session?.member?.id === memberId && session?.familyCode) {
                    router.replace(`/f/${session.familyCode}/perfil/${session.member.id}?section=wishes`);
                    return;
                }
            }
        } catch (e) {
            console.warn("[PublicWishListsPage] sesión inválida:", e);
        }

        // 2) cargar info del dueño (para mostrar el nombre arriba)
        (async () => {
            try {
                setLoadingOwner(true);

                const res = await fetch(`/api/members/${memberId}`, { method: "GET" });
                const data = await res.json().catch(() => null);

                if (res.ok && data?.member) {
                    setOwner({
                        name: data.member.name ?? "Usuario",
                        username: data.member.username ?? undefined,
                        avatar: data.member.avatar ?? undefined,
                    });
                }
            } finally {
                setLoadingOwner(false);
            }
        })();
    }, [memberId, router]);

    if (!memberId) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <p className="text-sm text-red-300">memberId inválido en la URL.</p>
            </div>
        );
    }

    // Mientras carga owner, igual podemos renderizar WishList (no bloquea)
    return (
        <div className="min-h-screen bg-black">
            <WishList
                memberId={memberId}
                owner={owner}
                canCreate={false}           // ✅ público: NO crear
                showLoginCTA               // ✅ público: botón ingresar
                onLogin={() => router.push("/")} // ✅ ajustar si tienes ruta propia de login
            />
            {loadingOwner ? null : null}
        </div>
    );
}
