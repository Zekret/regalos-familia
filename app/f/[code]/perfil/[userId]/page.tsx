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

type Owner = {
    id: string;
    name: string;
};

function readSessionSafe(): Session | null {
    try {
        const raw = localStorage.getItem("gf_session");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Session;

        if (!parsed?.familyCode || !parsed?.member?.id || !parsed?.member?.name) return null;
        return parsed;
    } catch {
        return null;
    }
}

export default function PerfilPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { code, userId } = useParams<{ code: string; userId: string }>();

    const [session, setSession] = useState<Session | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);

    const [owner, setOwner] = useState<Owner | null>(null);
    const [ownerLoading, setOwnerLoading] = useState(false);

    const activeSection: Section = useMemo(() => {
        const s = searchParams.get("section");
        return s === "family" ? "family" : "wishes";
    }, [searchParams]);

    // ✅ Default section
    useEffect(() => {
        const section = searchParams.get("section");
        if (!section) router.replace(`${pathname}?section=wishes`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    // ✅ Cargar sesión válida si pertenece a la misma familia
    useEffect(() => {
        if (!code || !userId) return;

        const s = readSessionSafe();
        if (!s || s.familyCode !== code) {
            setSession(null);
            setSessionError(null);
            setSessionLoading(false);
            return;
        }

        setSession(s);
        setSessionError(null);
        setSessionLoading(false);
    }, [code, userId]);

    // ✅ Guard: si no hay sesión, wishes -> pública, family -> login
    useEffect(() => {
        if (!code || !userId) return;
        if (sessionLoading) return;

        if (!session) {
            if (activeSection === "wishes") router.replace(`/u/${userId}/wishlists`);
            else router.replace(`/f/${code}/perfil`);
        }
    }, [code, userId, activeSection, sessionLoading, session, router]);

    const selfId = session?.member.id ?? "";
    const isOwnerViewingSelf = !!session && selfId === userId;

    // ✅ HREFs del nav SIEMPRE al perfil propio (para que “Lista de deseos” vuelva a ti)
    const familyHref = useMemo(() => {
        if (!code || !selfId) return `/f/${code}/perfil`;
        return `/f/${code}/perfil/${selfId}?section=family`;
    }, [code, selfId]);

    const wishesHref = useMemo(() => {
        if (!code || !selfId) return `/f/${code}/perfil`;
        return `/f/${code}/perfil/${selfId}?section=wishes`;
    }, [code, selfId]);

    // ✅ Resolver owner real en wishes (solo si estás viendo a otro)
    useEffect(() => {
        if (!code || !userId) return;
        if (sessionLoading) return;
        if (!session) return;
        if (activeSection !== "wishes") return;

        const controller = new AbortController();

        async function loadOwner() {
            if (isOwnerViewingSelf) {
                setOwner({ id: session.member.id, name: session.member.name });
                return;
            }

            try {
                setOwnerLoading(true);

                const res = await fetch(`/api/families/${code}/members/${userId}`, {
                    method: "GET",
                    signal: controller.signal,
                });

                const data = await res.json().catch(() => null);
                if (!res.ok) throw new Error(data?.message || "No se pudo cargar el familiar.");

                const m = data?.member ?? data;
                setOwner({ id: (m?.id ?? userId).toString(), name: (m?.name ?? "Familiar").toString() });
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("[PerfilPage] loadOwner error:", err);
                setOwner({ id: userId, name: "Familiar" });
            } finally {
                setOwnerLoading(false);
            }
        }

        loadOwner();
        return () => controller.abort();
    }, [code, userId, sessionLoading, session, activeSection, isOwnerViewingSelf]);

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

    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-sm text-gray-400">Redirigiendo...</p>
            </div>
        );
    }

    const ownerName =
        ownerLoading ? "Cargando..." : owner?.name ?? (isOwnerViewingSelf ? session.member.name : "Familiar");

    return (
        <div className="flex h-screen bg-black">
            <Sidebar
                activeSection={activeSection}
                familyHref={familyHref}
                wishesHref={wishesHref}
                memberName={session.member.name}
                familyCode={session.familyCode}
                onLogout={handleLogout}
                isViewingOwnWishes={isOwnerViewingSelf}
            />

            <main className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
                    {activeSection === "family" && (
                        <FamilyList familyCode={session.familyCode} currentMemberId={session.member.id} />
                    )}

                    {activeSection === "wishes" && (
                        <WishList
                            memberId={userId}
                            owner={{ name: ownerName }}
                            canCreate={isOwnerViewingSelf}
                            familyCode={session.familyCode}
                        />
                    )}
                </div>
            </main>

            <MobileNav
                activeSection={activeSection}
                familyHref={familyHref}
                wishesHref={wishesHref}
                isViewingOwnWishes={session.member.id === userId}
            />
        </div>
    );
}
