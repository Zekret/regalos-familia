// app/familia/crear/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff } from "lucide-react";

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
    const router = useRouter();

    const [familyName, setFamilyName] = useState("");
    const [memberName, setMemberName] = useState("");
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");

    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdData, setCreatedData] = useState<CreateFamilyResponse | null>(
        null
    );

    console.log(createdData)

    const handleOpen = () => {
        router.push(`/f/${createdData?.family.code}`);
    };

    const handleClose = () => {
        router.push("/");
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

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

    const familyLink =
        createdData && typeof window !== "undefined"
            ? `${window.location.origin}/f/${createdData.family.code}`
            : "";

    const goToJoinGroup = () => {
        router.push("/familia/ingresar");
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
                    {createdData ? (
                        // --- Vista de éxito ---
                        <>
                            <div className="mb-6">
                                <h2 className="text-white text-2xl sm:text-3xl mb-2">
                                    Familia creada
                                </h2>
                                <p className="text-gray-300 text-sm">
                                    Se creó el espacio para{" "}
                                    <span className="font-semibold">
                                        {createdData.family.name}
                                    </span>{" "}
                                    y tu lista de deseos.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-900 rounded-xl p-3 text-sm">
                                    <p className="font-semibold mb-1 text-gray-100">
                                        Comparte este enlace con tu familia:
                                    </p>
                                    <p className="break-all text-gray-100 text-xs bg-slate-950 rounded-lg p-2 border border-slate-700">
                                        {familyLink}
                                    </p>
                                </div>

                                <p className="text-gray-300 text-xs sm:text-sm">
                                    Cuando tus familiares usen este enlace, podrán crear su propio
                                    perfil con un PIN y su lista de deseos.
                                </p>

                                <button
                                    onClick={handleOpen}
                                    className="w-full bg-white text-slate-900 rounded-xl py-3.5 hover:bg-gray-100 transition-colors mt-2"
                                >
                                    Ingresar a la familia
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="w-full bg-white text-slate-900 rounded-xl py-3.5 hover:bg-gray-100 transition-colors mt-2"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </>
                    ) : (
                        // --- Formulario ---
                        <>
                            <div className="mb-6">
                                <h2 className="text-white text-2xl sm:text-3xl mb-2">
                                    Crear Grupo Familiar
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    Crea el espacio de tu familia y tu propia lista de deseos.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Nombre de la familia */}
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Nombre de la familia"
                                        value={familyName}
                                        onChange={(e) => setFamilyName(e.target.value)}
                                        className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        required
                                    />
                                </div>

                                {/* Tu nombre */}
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Tu nombre"
                                        value={memberName}
                                        onChange={(e) => setMemberName(e.target.value)}
                                        className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                        required
                                    />
                                    <p className="text-gray-400 text-xs mt-2 px-1">
                                        Así te verán los demás en la lista (puede ser tu nombre o
                                        apodo).
                                    </p>
                                </div>

                                {/* PIN */}
                                <div>
                                    <div className="relative">
                                        <input
                                            type={showPin ? "text" : "password"}
                                            placeholder="PIN de 4 dígitos"
                                            value={pin}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                setPin(value);
                                            }}
                                            className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            maxLength={4}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPin(!showPin)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                        >
                                            {showPin ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-gray-400 text-xs mt-2 px-1">
                                        Este PIN será tu llave para entrar y editar tu lista.
                                    </p>
                                </div>

                                {/* Confirmar PIN */}
                                <div>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPin ? "text" : "password"}
                                            placeholder="Confirmar PIN"
                                            value={pinConfirm}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                setPinConfirm(value);
                                            }}
                                            className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                            maxLength={4}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPin(!showConfirmPin)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                        >
                                            {showConfirmPin ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
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
                                    {isSubmitting ? "Creando familia..." : "Crear Grupo Familiar"}
                                </button>
                            </form>
                        </>
                    )}
                    {/* Switch a cre */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            ¿Ya estas en un grupo familiar?{" "}
                            <button
                                type="button"
                                onClick={goToJoinGroup}
                                className="text-white hover:text-emerald-400 transition-colors underline"
                            >
                                Ingresar a grupo familiar
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
