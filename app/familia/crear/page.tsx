"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type CreateFamilyResponse = {
    family: {
        id: string;
        name: string;
        code: string;
    };
    member: {
        id: string;
        name: string;
        role: string;
    };
    list: {
        id: string;
        title: string;
    };
};

export default function CrearFamiliaPage() {
    const [familyName, setFamilyName] = useState("");
    const [memberName, setMemberName] = useState("");
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdData, setCreatedData] = useState<CreateFamilyResponse | null>(
        null
    );

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validaciones básicas
        if (!familyName.trim() || !memberName.trim()) {
            setError("Por favor completa el nombre de la familia y tu nombre.");
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
            const res = await fetch("/api/families", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    familyName: familyName.trim(),
                    memberName: memberName.trim(),
                    pin,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || "No se pudo crear la familia.");
            }

            const data: CreateFamilyResponse = await res.json();
            setCreatedData(data);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Si ya se creó la familia, mostramos pantalla de éxito
    if (createdData) {
        const familyLink = `${typeof window !== "undefined" ? window.location.origin : ""}/f/${createdData.family.code}`;

        return (
            <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
                <header className="space-y-2">
                    <h1 className="text-xl font-bold text-center">
                        ✅ Familia creada
                    </h1>
                    <p className="text-sm text-center text-slate-600">
                        Se creó el espacio para <span className="font-semibold">{createdData.family.name}</span> y tu lista de deseos.
                    </p>
                </header>

                <div className="space-y-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-sm">
                        <p className="font-semibold mb-1">Comparte este enlace con tu familia:</p>
                        <p className="break-all text-slate-800 text-xs bg-white rounded-lg p-2 border border-slate-200">
                            {familyLink}
                        </p>
                    </div>

                    <p className="text-sm text-slate-600">
                        Cuando tus familiares usen este enlace, podrán crear su propio perfil con un PIN y su lista de deseos.
                    </p>
                </div>

                <Link
                    href="/"
                    className="block text-center text-sm text-blue-600 hover:underline"
                >
                    ← Volver al inicio
                </Link>
            </div>
        );
    }

    // Vista del formulario
    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
            <header className="space-y-2">
                <h1 className="text-xl font-bold text-center">Crear familia</h1>
                <p className="text-sm text-center text-slate-600">
                    Crea el espacio de tu familia y tu propia lista de deseos.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Nombre de la familia
                    </label>
                    <input
                        type="text"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Familia Pérez"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Tu nombre
                    </label>
                    <input
                        type="text"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Rosa, Juan, Sofi..."
                    />
                    <p className="text-xs text-slate-500">
                        Así te verán los demás en la lista (puede ser tu nombre o apodo).
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        PIN de 4 dígitos
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
                    <p className="text-xs text-slate-500">
                        Este PIN será tu llave para entrar y editar tu lista.
                    </p>
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
                    {isSubmitting ? "Creando familia..." : "Crear familia"}
                </button>
            </form>

            <Link
                href="/"
                className="block text-center text-sm text-blue-600 hover:underline"
            >
                ← Volver al inicio
            </Link>
        </div>
    );
}
