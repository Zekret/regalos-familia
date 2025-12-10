"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function NuevoMiembroPage() {
    const pathname = usePathname();
    // /f/RDQ850/nuevo-miembro -> ["f", "RDQ850", "nuevo-miembro"]
    const segments = pathname.split("/").filter(Boolean);
    const code = segments[1] || "(sin código)";

    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [created, setCreated] = useState<CreateMemberResponse | null>(null);

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
            const res = await fetch(`/api/families/${code}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    pin,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || "No se pudo crear tu perfil.");
            }

            const data: CreateMemberResponse = await res.json();
            setCreated(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Vista de éxito
    if (created) {
        return (
            <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
                <header className="space-y-2">
                    <h1 className="text-xl font-bold text-center">✅ Perfil creado</h1>
                    <p className="text-sm text-center text-slate-600">
                        Se creó tu perfil y tu lista de deseos dentro de la familia con
                        código{" "}
                        <span className="font-mono font-semibold">{code}</span>.
                    </p>
                </header>

                <div className="space-y-3 text-sm text-slate-700">
                    <p>
                        Tu nombre en la familia es:{" "}
                        <span className="font-semibold">{created.member.name}</span>
                    </p>
                    <p>
                        Recuerda tu PIN de 4 dígitos, lo necesitarás para entrar a tu lista
                        desde este u otros dispositivos.
                    </p>
                </div>

                <div className="space-y-2">
                    <Link
                        href={`/f/${code}/login`}
                        className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition"
                    >
                        Ir a “Ya tengo una lista aquí”
                    </Link>

                    <Link
                        href={`/f/${code}`}
                        className="block text-center text-sm text-blue-600 hover:underline"
                    >
                        ← Volver a la familia
                    </Link>
                </div>
            </div>
        );
    }

    // Vista del formulario
    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
            <header className="space-y-2">
                <h1 className="text-xl font-bold text-center">Soy nuevo aquí</h1>
                <p className="text-sm text-center text-slate-600">
                    Crea tu perfil en esta familia y elige un PIN para tu lista de
                    deseos.
                </p>
                <p className="text-xs text-center text-slate-500">
                    Código de la familia:{" "}
                    <span className="font-mono font-semibold">{code}</span>
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Tu nombre
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Abuela Rosa, Tío Juan, Sofi..."
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Elige un PIN de 4 dígitos
                    </label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 4) setPin(value);
                        }}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Confirmar PIN
                    </label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinConfirm}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 4) setPinConfirm(value);
                        }}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Creando tu perfil..." : "Crear mi perfil"}
                </button>
            </form>

            <Link
                href={`/f/${code}`}
                className="block text-center text-sm text-blue-600 hover:underline"
            >
                ← Volver a la familia
            </Link>
        </div>
    );
}
