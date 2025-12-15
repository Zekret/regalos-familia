// app/f/[code]/components/JoinFamilyForm.tsx
"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

type CreateMemberResponse = {
    member: { id: string; name: string };
};

type LoginMemberResponse = {
    familyCode: string;
    member: { id: string; name: string };
    lists: { id: string; title: string }[];
    token: string;
};

interface Props {
    familyCode: string;
}

export function JoinFamilyForm({ familyCode }: Props) {
    const router = useRouter();

    const [name, setName] = useState("");
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [showConfirmPin, setShowConfirmPin] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) return setError("Escribe tu nombre.");
        if (!/^\d{4}$/.test(pin)) return setError("El PIN debe tener 4 números.");
        if (pin !== pinConfirm) return setError("Los PIN no coinciden.");

        setIsSubmitting(true);

        try {
            const resCreate = await fetch(`/api/families/${familyCode}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), pin }),
            });

            if (!resCreate.ok) throw new Error("No se pudo crear el perfil.");

            const created: CreateMemberResponse = await resCreate.json();

            const resLogin = await fetch(
                `/api/families/${familyCode}/members/login`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim(), pin }),
                }
            );

            const sessionData: LoginMemberResponse = await resLogin.json();
            localStorage.setItem("gf_session", JSON.stringify(sessionData));

            router.replace(
                `/f/${familyCode}/perfil/${created.member.id}?section=wishes`
            );
        } catch (err: any) {
            setError(err.message || "Error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-slate-900 text-white rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500"
            />

            {/* PIN */}
            <div className="relative">
                <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="w-full bg-slate-900 text-white rounded-xl px-4 py-3.5 pr-12 text-center tracking-[0.4em]"
                />
                <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                    {showPin ? <EyeOff /> : <Eye />}
                </button>
            </div>

            {/* Confirm PIN */}
            <div className="relative">
                <input
                    type={showConfirmPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    value={pinConfirm}
                    onChange={(e) =>
                        setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="••••"
                    className="w-full bg-slate-900 text-white rounded-xl px-4 py-3.5 pr-12 text-center tracking-[0.4em]"
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                    {showConfirmPin ? <EyeOff /> : <Eye />}
                </button>
            </div>

            {error && (
                <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-slate-900 rounded-xl py-3.5 hover:bg-gray-100 transition disabled:opacity-60"
            >
                {isSubmitting ? "Uniéndote..." : "Unirme a la familia"}
            </button>
        </form>
    );
}
