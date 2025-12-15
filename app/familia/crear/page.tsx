// app/familia/crear/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, Share2, Link as LinkIcon, Check } from "lucide-react";

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

    const [showShareSection, setShowShareSection] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleOpen = () => {
        const code = createdData?.family?.code;
        const memberId = createdData?.member?.id;

        // ✅ Guard rail: evita navegar a rutas incompletas
        if (!code || !memberId) {
            console.log("[handleOpen] createdData =", createdData);
            setError("No pude abrir tu perfil porque faltan datos (code o memberId).");
            return;
        }

        router.push(
            `/f/${encodeURIComponent(code)}/perfil/${encodeURIComponent(
                memberId
            )}?section=wishes`
        );
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

            // ✅ Leemos el response "raw" y lo dejamos en consola para debug
            const raw = await res.json();
            console.log("[CREATE FAMILY] raw response =", raw);

            // ✅ Normalizamos por si el backend trae memberId / member_id, etc.
            const normalized: CreateFamilyResponse = {
                family: raw.family,
                member: {
                    id: raw.member?.id ?? raw.member_id ?? raw.memberId ?? "",
                    name: raw.member?.name ?? raw.memberName ?? "",
                    role: raw.member?.role ?? raw.role ?? "owner",
                },
                list: raw.list,
            };

            // ✅ Guard rail: si falta algo clave, mostramos error y no dejamos estado roto
            if (!normalized.family?.code) {
                console.log("[CREATE FAMILY] normalized =", normalized);
                throw new Error(
                    "La familia se creó pero no recibí el código (family.code). Revisa el response del backend."
                );
            }
            if (!normalized.member?.id) {
                console.log("[CREATE FAMILY] normalized =", normalized);
                throw new Error(
                    "La familia se creó pero no recibí el id del miembro (member.id). Revisa el response del backend."
                );
            }

            setCreatedData(normalized);

            // ✅ al crear, dejamos el compartir cerrado por defecto
            setShowShareSection(false);
            setCopied(false);
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

    // ✅ compartir / copiar
    const handleShareLink = async () => {
        if (!familyLink) return;

        try {
            // 1) Web Share API (ideal en mobile)
            if (typeof navigator !== "undefined" && (navigator as any).share) {
                await (navigator as any).share({
                    title: "Mi grupo familiar",
                    text: "Únete a mi grupo familiar usando este enlace:",
                    url: familyLink,
                });
                return;
            }

            // 2) fallback: copiar al clipboard
            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(familyLink);
            } else {
                // 3) fallback extra viejo
                const textarea = document.createElement("textarea");
                textarea.value = familyLink;
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch (e) {
            setError("No se pudo compartir/copiar el enlace. Intenta nuevamente.");
        }
    };

    const canOpenProfile = !!createdData?.family?.code && !!createdData?.member?.id;

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

                            {error && (
                                <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-lg px-3 py-2 mb-3">
                                    {error}
                                </p>
                            )}

                            <div className="space-y-4">
                                {/* Botón compartir que despliega sección */}
                                <button
                                    type="button"
                                    onClick={() => setShowShareSection((v) => !v)}
                                    className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl py-3.5 hover:bg-slate-950 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-5 h-5" />
                                    {showShareSection ? "Ocultar enlace" : "Compartir enlace"}
                                </button>

                                {/* Sección desplegable */}
                                {showShareSection && (
                                    <div className="bg-slate-900 rounded-xl p-3 text-sm border border-slate-700">
                                        <p className="font-semibold mb-2 text-gray-100 flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            Comparte este enlace con tu familia:
                                        </p>

                                        <p className="break-all text-gray-100 text-xs bg-slate-950 rounded-lg p-2 border border-slate-700">
                                            {familyLink}
                                        </p>

                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleShareLink}
                                                className="flex-1 bg-white text-slate-900 rounded-xl py-2.5 hover:bg-gray-100 transition-colors"
                                            >
                                                {typeof navigator !== "undefined" &&
                                                    (navigator as any).share
                                                    ? "Compartir"
                                                    : "Copiar enlace"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setShowShareSection(false)}
                                                className="px-4 bg-slate-800 text-gray-100 rounded-xl py-2.5 hover:bg-slate-700 transition-colors border border-slate-700"
                                            >
                                                Cerrar
                                            </button>
                                        </div>

                                        {copied && (
                                            <p className="mt-2 text-emerald-400 text-xs flex items-center gap-2">
                                                <Check className="w-4 h-4" /> Enlace copiado ✅
                                            </p>
                                        )}
                                    </div>
                                )}

                                <p className="text-gray-300 text-xs sm:text-sm">
                                    Cuando tus familiares usen este enlace, podrán crear su propio
                                    perfil con un PIN y su lista de deseos.
                                </p>

                                <button
                                    onClick={handleOpen}
                                    disabled={!canOpenProfile}
                                    className="w-full bg-white text-slate-900 rounded-xl py-3.5 hover:bg-gray-100 transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                                            placeholder="••••"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={pin}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 4);
                                                setPin(value);
                                            }}
                                            className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 pr-12 text-sm tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                                            placeholder="••••"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={pinConfirm}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 4);
                                                setPinConfirm(value);
                                            }}
                                            className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 pr-12 text-sm tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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

                    {/* Switch a ingresar */}
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
