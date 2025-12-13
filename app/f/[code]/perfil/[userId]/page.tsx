"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users, Heart, LogOut } from "lucide-react";

import { FamilyList } from "@/app/f/[code]/perfil/components/FamilyList";
import { WishList } from "@/app/f/[code]/perfil/components/WishList";

type Session = {
    familyCode: string;
    member: { id: string; name: string };
    token: string;
};

type Section = "family" | "wishes";

/** Sidebar inline (para que sea 1 solo archivo) */
function SidebarInline(props: {
    activeSection: Section;
    onGoFamily: () => void;
    onGoWishes: () => void;
    memberName?: string;
    familyCode?: string;
    onLogout?: () => void;
}) {
    const { activeSection, onGoFamily, onGoWishes, memberName, familyCode, onLogout } = props;

    return (
        <aside className="hidden md:flex w-64 bg-black border-r border-gray-800 flex-col">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-white text-lg font-semibold">
                    {memberName ? `Hola, ${memberName}` : "Mi Aplicación"}
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                    {familyCode ? `Código familia: ${familyCode}` : "Bienvenido de nuevo"}
                </p>
            </div>

            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    <li>
                        <button
                            type="button"
                            onClick={onGoFamily}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === "family"
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="text-sm">Lista de familiares</span>
                        </button>
                    </li>

                    <li>
                        <button
                            type="button"
                            onClick={onGoWishes}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === "wishes"
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                                }`}
                        >
                            <Heart className="w-5 h-5" />
                            <span className="text-sm">Lista de deseos</span>
                        </button>
                    </li>
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-900 hover:text-gray-200 rounded-lg transition-colors text-sm"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </aside>
    );
}

/** MobileNav inline (para que sea 1 solo archivo) */
function MobileNavInline(props: {
    activeSection: Section;
    onGoFamily: () => void;
    onGoWishes: () => void;
}) {
    const { activeSection, onGoFamily, onGoWishes } = props;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
            <div className="flex items-center justify-around">
                <button
                    type="button"
                    onClick={onGoFamily}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeSection === "family" ? "text-white" : "text-gray-400 hover:text-gray-200"
                        }`}
                >
                    <Users className="w-6 h-6" />
                    <span className="text-xs">Familiares</span>
                </button>

                <button
                    type="button"
                    onClick={onGoWishes}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeSection === "wishes" ? "text-white" : "text-gray-400 hover:text-gray-200"
                        }`}
                >
                    <Heart className="w-6 h-6" />
                    <span className="text-xs">Deseos</span>
                </button>
            </div>
        </nav>
    );
}

export default function PerfilPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { code, userId } = useParams<{ code: string; userId: string }>();

    const [session, setSession] = useState<Session | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);

    // ✅ Default: si no viene ?section= -> family
    useEffect(() => {
        const section = searchParams.get("section");
        if (!section) {
            router.replace(`${pathname}?section=family`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams]);

    const activeSection: Section = useMemo(() => {
        const s = searchParams.get("section");
        return s === "wishes" ? "wishes" : "family";
    }, [searchParams]);

    // ✅ Leer sesión
    useEffect(() => {
        try {
            const raw = localStorage.getItem("gf_session");
            if (!raw) {
                setSessionError("No se encontró la sesión. Vuelve a iniciar sesión.");
                setSessionLoading(false);
                return;
            }

            const parsed = JSON.parse(raw) as Session;

            if (parsed.familyCode !== code) {
                setSessionError("La sesión no coincide con esta familia.");
                setSessionLoading(false);
                return;
            }

            if (parsed.member.id !== userId) {
                setSessionError("La sesión no coincide con este usuario.");
                setSessionLoading(false);
                return;
            }

            setSession(parsed);
            setSessionLoading(false);
        } catch (err) {
            console.error("Error leyendo gf_session:", err);
            setSessionError("Ocurrió un problema al leer tu sesión.");
            setSessionLoading(false);
        }
    }, [code, userId]);

    const goSection = (section: Section) => {
        router.push(`${pathname}?section=${section}`);
    };

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

    if (sessionError || !session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 px-4 py-3 rounded-xl max-w-sm mx-auto">
                        {sessionError ?? "No hay sesión activa. Vuelve a iniciar sesión."}
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push(`/f/${code}/perfil`)}
                        className="text-xs text-gray-300 underline hover:text-emerald-400"
                    >
                        Ir a la pantalla de login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black">
            <SidebarInline
                activeSection={activeSection}
                onGoFamily={() => goSection("family")}
                onGoWishes={() => goSection("wishes")}
                memberName={session.member.name}
                familyCode={session.familyCode}
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0">
                    {activeSection === "family" && (
                        <FamilyList familyCode={session.familyCode} currentMemberId={session.member.id} />
                    )}

                    {activeSection === "wishes" && (
                        <WishList
                            memberId={session.member.id}
                            owner={{ name: session.member.name }}
                            canCreate
                        />
                    )}
                </div>
            </main>

            <MobileNavInline
                activeSection={activeSection}
                onGoFamily={() => goSection("family")}
                onGoWishes={() => goSection("wishes")}
            />
        </div>
    );
}
