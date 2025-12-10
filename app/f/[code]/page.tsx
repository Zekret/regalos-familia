"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FamiliaPage() {
    const pathname = usePathname();
    const segments = pathname.split("/");
    const code = segments[2] || "(sin código)";

    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
            <header className="space-y-2">
                <h1 className="text-xl font-bold text-center">Espacio familiar</h1>

                <p className="text-sm text-center text-slate-600">
                    Código familiar:{" "}
                    <span className="font-mono font-semibold">{code}</span>
                </p>

                <p className="text-sm text-center text-slate-600 mt-2">
                    Aquí podrás crear tu perfil con PIN o entrar a tu lista de deseos.
                </p>
            </header>

            <div className="space-y-3">
                <Link
                    href={`/f/${code}/nuevo-miembro`}
                    className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition"
                >
                    Soy nuevo aquí
                </Link>

                <Link
                    href={`/f/${code}/login`}
                    className="block w-full text-center py-3 rounded-xl border border-slate-300 font-semibold text-base hover:bg-slate-100 transition"
                >
                    Ya tengo una lista aquí
                </Link>
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
