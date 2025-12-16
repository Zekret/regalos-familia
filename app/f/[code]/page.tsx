// app/f/[code]/page.tsx
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, Eye, EyeOff } from "lucide-react";
import { JoinFamilyForm } from "./components/JoinFamilyForm";

type Family = {
    id: string;
    name: string;
    code: string;
};

type MemberList = {
    id: string;
    title: string;
};

type LoginMemberResponse = {
    familyCode: string;
    member: { id: string; name: string };
    lists: MemberList[];
    token: string;
};

function buildFamilyTitle(name?: string) {
    if (!name) return "Espacio familiar";

    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith("familia ")) return trimmed;

    const wordCount = trimmed.split(" ").length;
    if (wordCount > 2) return trimmed;
    if (/\d/.test(trimmed)) return trimmed;

    return `Familia ${trimmed}`;
}

type Mode = "login" | "join";

export default function FamiliaPage() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // /f/[code] -> ["f", "{code}"]
    const segments = pathname.split("/").filter(Boolean);
    const familyCode = segments[1];

    const mode: Mode = (searchParams.get("mode") as Mode) || "login";

    const setMode = (next: Mode) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("mode", next);
        router.push(`${pathname}?${params.toString()}`);
    };

    const [family, setFamily] = useState<Family | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [loadingFamily, setLoadingFamily] = useState(true);

    // ---------- LOGIN STATE ----------
    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar datos de la familia
    useEffect(() => {
        const loadFamily = async () => {
            try {
                const res = await fetch(`/api/families/${familyCode}`);

                if (res.status === 404) {
                    setNotFound(true);
                    setFamily(null);
                    setLoadingFamily(false);
                    return;
                }

                if (!res.ok) throw new Error("Error al obtener la familia");

                const data = await res.json();
                setFamily(data);
            } catch (err) {
                console.error("Error loading family:", err);
                setNotFound(true);
            } finally {
                setLoadingFamily(false);
            }
        };

        loadFamily();
    }, [familyCode]);

    // Reset errores al cambiar de modo
    useEffect(() => {
        setError(null);
    }, [mode]);

    const handleLoginSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Por favor escribe tu nombre.");
            return;
        }

        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            setError("El PIN debe tener exactamente 4 números.");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/families/${familyCode}/members/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), pin }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || "No se pudo iniciar sesión.");
            }

            const data: LoginMemberResponse = await res.json();

            if (typeof window !== "undefined") {
                localStorage.setItem("gf_session", JSON.stringify(data));
            }

            router.push(`/f/${familyCode}/perfil/${data.member.id}`);
        } catch (err: any) {
            setError(err?.message || "Ocurrió un error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ---------- ESTADOS ----------
    if (notFound && !loadingFamily) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-3xl font-bold text-white mb-3">Familia no encontrada</h1>
                <p className="text-sm text-gray-400 mb-6 max-w-md">
                    El código{" "}
                    <span className="font-mono text-emerald-400">{familyCode}</span>{" "}
                    no corresponde a ningún espacio familiar creado o ya no está disponible.
                </p>
                <button
                    onClick={() => router.push("/familia/ingresar")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 transition"
                >
                    Volver a ingresar código
                </button>
            </div>
        );
    }

    if (loadingFamily) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-sm text-gray-400">Cargando espacio familiar...</p>
            </div>
        );
    }

    // ---------- MODAL ----------
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto">
                <button
                    onClick={() => router.push("/")}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors z-10"
                >
                    <X className="w-5 h-5 text-gray-300" />
                </button>

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-white text-2xl sm:text-3xl mb-2">
                            {family ? buildFamilyTitle(family.name) : "Espacio familiar"}
                        </h2>
                        <p className="text-emerald-400 mb-1">Código familiar: {familyCode}</p>
                    </div>

                    {/* CONTENIDO SEGÚN MODO */}
                    {mode === "login" ? (
                        <>
                            <header className="mb-6 space-y-2">
                                <h1 className="text-white text-xl sm:text-2xl text-left">
                                    Iniciar sesión
                                </h1>
                                <p className="text-sm text-gray-400">
                                    Escribe tu nombre y tu PIN para entrar a tu perfil.
                                </p>
                            </header>

                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        placeholder="Nombre de usuario"
                                    />
                                </div>

                                <div>
                                    <div className="relative">
                                        <input
                                            type={showPin ? "text" : "password"}
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={pin}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                setPin(value);
                                            }}
                                            className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 pr-12 text-sm tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            placeholder="••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPin(!showPin)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                        >
                                            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-lg px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Entrando..." : "Entrar"}
                                </button>
                            </form>

                            {/* CTA para ir a JOIN */}
                            <div className="pt-4 mt-6 border-t border-slate-700">
                                <button
                                    onClick={() => setMode("join")}
                                    className="w-full bg-slate-900 text-white rounded-xl py-3.5 hover:bg-slate-700 transition"
                                >
                                    Aún no soy parte
                                </button>
                                <p className="text-xs text-gray-500 mt-3 text-center">
                                    Crea tu perfil para comenzar tu lista de deseos.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <header className="mb-6 space-y-2">
                                <h1 className="text-white text-xl sm:text-2xl text-left">
                                    Unirme a la familia
                                </h1>
                                <p className="text-sm text-gray-400">
                                    Crea tu perfil para empezar tu lista de deseos.
                                </p>
                            </header>

                            <JoinFamilyForm familyCode={familyCode} />

                            {/* CTA para volver a LOGIN */}
                            <div className="pt-4 mt-6 border-t border-slate-700">
                                <button
                                    onClick={() => setMode("login")}
                                    className="w-full bg-slate-900 text-white rounded-xl py-3.5 hover:bg-slate-700 transition"
                                >
                                    Ya tengo cuenta
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
