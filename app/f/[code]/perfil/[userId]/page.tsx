"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/app/f/[code]/perfil/components/Sidebar";
import { FamilyList } from "@/app/f/[code]/perfil/components/FamilyList"; 
import { WishList } from "../components/WishList";
import { MobileNav } from "../components/MobileNav";

type Session = {
    familyCode: string;
    member: {
        id: string;
        name: string;
    };
    token: string;
};

export default function MemberDashboardPage() {
    const router = useRouter();
    const { code, userId } = useParams<{ code: string; userId: string }>();

    const [activeSection, setActiveSection] = useState<"family" | "wishes">("family");

    const [session, setSession] = useState<Session | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("gf_session");
            if (!raw) {
                setSessionError("No se encontró la sesión. Vuelve a iniciar sesión.");
                setSessionLoading(false);
                return;
            }

            const parsed = JSON.parse(raw) as Session;

            // Validar que la sesión coincida con la URL
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

    const handleLogout = () => {
        localStorage.removeItem("gf_session");
        router.push(`/f/${code}`); // devolver a la familia
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
            <Sidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                memberName={session.member.name}
                familyCode={session.familyCode}
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto">
                    {activeSection === "family" && (
                        <FamilyList
                            familyCode={session.familyCode}
                            currentMemberId={session.member.id}
                        />
                    )}

                    {activeSection === "wishes" && (
                        <WishList
                            memberId={session.member.id}
                        />
                    )}
                </div>
            </main>

            {/* Mobile nav */}
            <MobileNav
                activeSection={activeSection}
                onSectionChange={setActiveSection}
            />
        </div>
    );
}
