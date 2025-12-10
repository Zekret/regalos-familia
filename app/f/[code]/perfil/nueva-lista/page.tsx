"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

type SessionData = {
    familyCode: string;
    member: {
        id: string;
        name: string;
    };
    token: string;
};

export default function NuevaListaPage() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);
    const code = segments[1] || "(sin código)";

    const router = useRouter();

    const [session, setSession] = useState<SessionData | null>(null);
    const [title, setTitle] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const raw = localStorage.getItem("gf_session");
            if (!raw) {
                setError("Necesitas iniciar sesión nuevamente.");
                return;
            }
            const parsed = JSON.parse(raw) as SessionData;
            setSession(parsed);
        } catch (err) {
            console.error("[NEW LIST PAGE] error leyendo sesión:", err);
            setError("Ocurrió un problema al leer tu sesión.");
        }
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!session) {
            setError("Sesión no encontrada. Vuelve a iniciar sesión.");
            return;
        }

        if (!title.trim()) {
            setError("Escribe un título para tu lista.");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/members/${session.member.id}/lists`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim() }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                throw new Error(data?.message || "No se pudo crear la lista.");
            }

            // Opcional: actualizar listas en localStorage (no es estrictamente necesario
            // porque el perfil hace GET, pero ayuda a mantenerlo coherente)
            if (typeof window !== "undefined") {
                const raw = localStorage.getItem("gf_session");
                if (raw) {
                    const prev = JSON.parse(raw);
                    const updated = {
                        ...prev,
                        lists: [...(prev.lists ?? []), data.list],
                    };
                    localStorage.setItem("gf_session", JSON.stringify(updated));
                }
            }

            // Redirigir de vuelta al perfil
            router.push(`/f/${code}/perfil`);
        } catch (err: any) {
            console.error("[NEW LIST PAGE] error creando lista:", err);
            setError(err.message || "Error al crear la lista.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!session && !error) {
        return (
            <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
                <p className="text-sm text-slate-600">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
            <header className="space-y-2">
                <h1 className="text-xl font-bold text-center">Crear nueva lista</h1>
                <p className="text-sm text-center text-slate-600">
                    Esta lista quedará asociada a tu perfil en la familia{" "}
                    <span className="font-mono font-semibold">{code}</span>.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Título de la lista
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Navidad 2025, Cumpleaños, Amigo Secreto..."
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
                    {isSubmitting ? "Creando lista..." : "Crear lista"}
                </button>
            </form>

            <Link
                href={`/f/${code}/perfil`}
                className="block text-center text-sm text-blue-600 hover:underline"
            >
                ← Volver a mi perfil
            </Link>
        </div>
    );
}
