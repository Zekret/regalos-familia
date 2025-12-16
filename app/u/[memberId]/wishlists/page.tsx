"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WishList } from "@/app/f/[code]/perfil/components/WishList";
import { FloatingLoginButton } from "@/app/f/[code]/perfil/components/FloatingLoginButton";

type Session = {
    familyCode: string;
    member: { id: string; name: string };
    token: string;
};

type Owner = {
    name: string;
    username?: string;
    avatar?: string;
    familyCode?: string; // ✅ necesitamos esto para "unirse a esta familia"
};

export default function PublicWishListsPage() {
    const router = useRouter();
    const pathname = usePathname();

    // /u/{memberId}/wishlists
    const segments = pathname.split("/").filter(Boolean);
    const memberId = segments[1] || "";

    const [owner, setOwner] = useState<Owner>({ name: "Usuario" });
    const [loadingOwner, setLoadingOwner] = useState(true);

    // ✅ estado simple de sesión (para decidir si mostrar botón)
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        // cargar sesión 1 sola vez
        try {
            const raw = localStorage.getItem("gf_session");
            if (raw) setSession(JSON.parse(raw) as Session);
        } catch {
            setSession(null);
        }
    }, []);

    useEffect(() => {
        if (!memberId) return;

        // 1️⃣ si está logeado y es el dueño → redirigir a vista interna
        try {
            const raw = localStorage.getItem("gf_session");
            if (raw) {
                const s = JSON.parse(raw) as Session;

                if (s.member.id === memberId && s.familyCode) {
                    router.replace(`/f/${s.familyCode}/perfil/${s.member.id}?section=wishes`);
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
                    setOwner({
                        name: data.name,
                        username: data.username ?? undefined,
                        avatar: data.avatar ?? undefined,
                        // ✅ OJO: ajusta el nombre de campo según tu API
                        familyCode: data.familyCode ?? data.family_code ?? undefined,
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

    const isOwner = session?.member?.id === memberId;
    const showFloating = !isOwner; // si fuese dueño ya lo rediriges arriba

    return (
        <div className="min-h-screen bg-black">
            <WishList
                memberId={memberId}
                owner={owner}
                canCreate={false}
            />

            {showFloating ? (
                <FloatingLoginButton
                    familyCode={owner.familyCode} // puede ser undefined
                    familyName={owner.name}
                />
            ) : null}

        </div>
    );
}
