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

    // /u/{memberId}/wishlists
    const segments = pathname.split("/").filter(Boolean);
    const memberId = segments[1] || "";

    const [owner, setOwner] = useState<Owner>({ name: "Usuario" });
    const [loadingOwner, setLoadingOwner] = useState(true);

    useEffect(() => {
        if (!memberId) return;

        // 1️⃣ si está logeado y es el dueño → redirigir a vista interna
        try {
            const raw = localStorage.getItem("gf_session");
            if (raw) {
                const session = JSON.parse(raw) as Session;

                if (session.member.id === memberId && session.familyCode) {
                    router.replace(
                        `/f/${session.familyCode}/perfil/${session.member.id}?section=wishes`
                    );
                    return;
                }
            }
        } catch {
            // ignore
        }

        // 2️⃣ cargar info pública del dueño
        (async () => {
            try {
                setLoadingOwner(true);

                const res = await fetch(`/api/public/members/${memberId}`);
                const data = await res.json().catch(() => null);

                if (res.ok && data?.name) {
                    setOwner({ name: data.name, username: data.username ?? undefined, avatar: data.avatar ?? undefined });
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

    console.log(owner, "Owneerrr")

    return (
        <div className="min-h-screen bg-black">
            <WishList
                memberId={memberId}
                owner={owner}          // ✅ ahora sí viene el nombre real
                canCreate={false}      // público
                showLoginCTA
                onLogin={() => router.push("/")}
            />
        </div>
    );
}
