"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { FamilyList } from "@/app/f/[code]/perfil/components/FamilyList";
import { WishList } from "@/app/f/[code]/perfil/components/WishList";
import { Sidebar } from "../components/Sidebar";
import { MobileNav } from "../components/MobileNav";

type Session = {
    familyCode: string;
    member: { id: string; name: string };
    token: string;
};

type Section = "family" | "wishes";

export default function PerfilPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { code, userId } = useParams<{ code: string; userId: string }>();

    const [session, setSession] = useState<Session | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);

    const activeSection: Section = useMemo(() => {
        const s = searchParams.get("section");
        return s === "wishes" ? "wishes" : "family";
    }, [searchParams]);

    // ✅ URLs para Sidebar/MobileNav
    const familyHref = `/f/${code}/perfil/${userId}?section=family`;
    const wishesHref = `/f/${code}/perfil/${userId}?section=wishes`;

    // ✅ Default: si no viene ?section= -> family
    useEffect(() => {
        const section = searchParams.get("section");
        if (!section) router.replace(`${pathname}?section=wishes`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    // ✅ Guard principal:
    // Si entran a ?section=wishes sin ser dueño (o sin sesión) -> mandarlos a vista pública.
    useEffect(() => {
        const isWishes = searchParams.get("section") === "wishes";
        if (!isWishes) return;

        if (!code || !userId) return;

        try {
            const raw = localStorage.getItem("gf_session");
            if (!raw) {
                router.replace(`/u/${userId}/wishlists`);
                return;
            }

            const parsed = JSON.parse(raw) as Session;

            const isOwner = parsed?.member?.id === userId;
            const isSameFamily = parsed?.familyCode === code;

            if (!isOwner || !isSameFamily) {
                router.replace(`/u/${userId}/wishlists`);
                return;
            }
        } catch {
            router.replace(`/u/${userId}/wishlists`);
        }
    }, [code, userId, router, searchParams]);

    // ✅ Leer sesión normal (solo para renderizar vista interna)
    // Importante: si NO hay sesión o NO coincide, NO es "error":
    // simplemente no puede ver el perfil privado.
    useEffect(() => {
        if (!code || !userId) return;

        try {
            const raw = localStorage.getItem("gf_session");

            if (!raw) {
                setSession(null);
                setSessionError(null);
                setSessionLoading(false);
                return;
            }

            const parsed = JSON.parse(raw) as Session;

            const isSameFamily = parsed.familyCode === code;
            const isOwner = parsed.member.id === userId;

            if (!isSameFamily || !isOwner) {
                setSession(null);
                setSessionError(null);
                setSessionLoading(false);
                return;
            }

            setSession(parsed);
            setSessionError(null);
            setSessionLoading(false);
        } catch (err) {
            console.error("Error leyendo gf_session:", err);
            setSession(null);
            setSessionError(null);
            setSessionLoading(false);
        }
    }, [code, userId]);

    // ✅ Si no hay sesión válida, mandarlo al login del miembro (NO al inicio /f/${code})
    useEffect(() => {
        if (!sessionLoading && !sessionError && !session && code) {
            router.replace(`/f/${code}/perfil`);
        }
    }, [sessionLoading, sessionError, session, code, router]);

    const handleLogout = () => {
        localStorage.removeItem("gf_session");
        router.push(`/f/${code}`);
    };

    if (sessionLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-sm text-gray-400">Cargando sesión...</p>
            </div>
        );
    }

    if (sessionError) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 px-4 py-3 rounded-xl max-w-sm mx-auto">
                        {sessionError}
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push(`/f/${code}/perfil`)}
                        className="text-xs text-gray-300 underline hover:text-emerald-400"
                    >
                        Ir a iniciar sesión
                    </button>
                </div>
            </div>
        );
    }

    // Mientras redirige (cuando no hay sesión válida)
    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-sm text-gray-400">Redirigiendo...</p>
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
                    {activeSection === "family" && (
                        <FamilyList
                            familyCode={session.familyCode}
                            currentMemberId={session.member.id}
                        />
                    )}

                    {activeSection === "wishes" && (
                        <WishList
                            memberId={session.member.id}
                            owner={{ name: session.member.name }}
                            canCreate
                            familyCode={session.familyCode}
                        />
                    )}
                </div>
            </main>

            <MobileNav
                activeSection={activeSection}
                familyHref={familyHref}
                wishesHref={wishesHref}
            />
        </div>
    );
}
