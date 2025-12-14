// app/f/[code]/nuevo-miembro/page.tsx
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, Eye, EyeOff } from "lucide-react";

type CreateMemberResponse = {
    familyCode: string;
    member: {
        id: string;
        name: string;
    };
    list: {
        id: string;
        title: string;
    };
};

type LoginMemberResponse = {
    familyCode: string;
    member: {
        id: string;
        name: string;
    };
    lists: { id: string; title: string }[];
    token: string;
};

export default function NuevoMiembroPage() {
    const pathname = usePathname();
    const router = useRouter();

    // /f/RDQ850/nuevo-miembro -> ["f", "RDQ850", "nuevo-miembro"]
    const segments = pathname.split("/").filter(Boolean);
    const code = segments[1] || "(sin código)";

    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        router.push(`/f/${code}`);
    };

    const handleSubmit = async (e: FormEvent) => {
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

        if (pin !== pinConfirm) {
            setError("El PIN y la confirmación no coinciden.");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1) Crear miembro
            const resCreate = await fetch(`/api/families/${code}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    pin,
                }),
            });

            if (!resCreate.ok) {
                const data = await resCreate.json().catch(() => null);
                throw new Error(data?.message || "No se pudo crear tu perfil.");
            }

            const created: CreateMemberResponse = await resCreate.json();

            // 2) Login automático para generar token y guardar gf_session
            const resLogin = await fetch(`/api/families/${code}/members/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    pin,
                }),
            });

            if (!resLogin.ok) {
                const data = await resLogin.json().catch(() => null);
                throw new Error(
                    data?.message ||
                    "Tu perfil se creó, pero no se pudo iniciar sesión automáticamente. Intenta ingresar con tu PIN."
                );
            }

            const sessionData: LoginMemberResponse = await resLogin.json();

            // 3) Guardar sesión
            if (typeof window !== "undefined") {
                localStorage.setItem("gf_session", JSON.stringify(sessionData));
            }

            // 4) Redirigir directo al perfil del nuevo usuario
            router.replace(`/f/${code}/perfil/${created.member.id}?section=family`);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md relative shadow-2xl">
                {/* Botón cerrar */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                >
                    <X className="w-5 h-5 text-gray-300" />
                </button>

                <div className="p-6 sm:p-8">
                    {/* --- Formulario --- */}
                    <div className="mb-6">
                        <h1 className="text-white text-2xl sm:text-3xl mb-2">Soy nuevo aquí</h1>
                        <p className="text-gray-400 text-sm">
                            Crea tu perfil en esta familia y elige un PIN para tu lista de deseos.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Código de la familia:{" "}
                            <span className="font-mono font-semibold text-gray-200">{code}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Tu nombre */}
                        <div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                placeholder="Nombre de usuario"
                            />
                        </div>

                        {/* PIN */}
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
                            <p className="text-gray-400 text-xs mt-2 px-1">
                                Elige un PIN de 4 dígitos, será tu llave para entrar a tu lista.
                            </p>
                        </div>

                        {/* Confirmar PIN */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showConfirmPin ? "text" : "password"}
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={pinConfirm}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                        setPinConfirm(value);
                                    }}
                                    className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 pr-12 text-sm tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    placeholder="••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                    {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                            className="w-full bg-white text-slate-900 rounded-xl py-3.5 hover:bg-gray-100 transition-colors mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Creando tu perfil..." : "Crear mi perfil"}
                        </button>

                        <Link
                            href={`/f/${code}`}
                            className="block text-center text-xs text-gray-400 hover:text-emerald-400 transition-colors underline pt-2"
                        >
                            ← Volver a la familia
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}
