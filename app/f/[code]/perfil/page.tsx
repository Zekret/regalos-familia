"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Eye, EyeOff } from "lucide-react";

type MemberList = {
  id: string;
  title: string;
};

type LoginMemberResponse = {
  familyCode: string;
  member: {
    id: string;
    name: string;
  };
  lists: MemberList[];
  token: string;
};

type FamilyMember = {
  id: string;
  name: string;
  created_at?: string;
};

export default function LoginMiembroPage() {
  const pathname = usePathname();
  // /f/RDQ850/login -> ["f", "RDQ850", "login"]
  const segments = pathname.split("/").filter(Boolean);
  const code = segments[1] || "(sin código)";

  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

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

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/families/${code}/members/login`, {
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
        throw new Error(data?.message || "No se pudo iniciar sesión.");
      }

      const data: LoginMemberResponse = await res.json();
      // Guardar sesión en localStorage para usarla luego en /f/[code]/perfil/[userId]
      if (typeof window !== "undefined") {
        localStorage.setItem("gf_session", JSON.stringify(data));
      }
      router.push(`/f/${code}/perfil/${data.member.id}`)
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
          <>
            <header className="mb-6 space-y-2">
              <h1 className="text-white text-2xl sm:text-3xl text-left">
                Ya tengo una lista aquí
              </h1>
              <p className="text-sm text-gray-400">
                Escribe tu nombre y tu PIN para entrar a tu perfil.
              </p>
              <p className="text-xs text-gray-500">
                Código de la familia:{" "}
                <span className="font-mono font-semibold text-gray-200">
                  {code}
                </span>
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    {showPin ? (
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
                className="w-full py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Entrando..." : "Entrar a mi perfil"}
              </button>
            </form>
          </>



        </div>
      </div>
    </div>
  );
}
