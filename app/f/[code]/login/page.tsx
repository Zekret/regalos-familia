"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
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
  const [logged, setLogged] = useState<LoginMemberResponse | null>(null);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

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
      // Guardar sesión en localStorage para usarla en /perfil y /perfil/nueva-lista
      if (typeof window !== "undefined") {
        localStorage.setItem("gf_session", JSON.stringify(data));
      }
      setLogged(data);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cuando el login fue correcto, cargamos los miembros de la familia
  useEffect(() => {
    const fetchMembers = async () => {
      if (!logged) return;
      try {
        setMembersLoading(true);
        setMembersError(null);

        const res = await fetch(`/api/families/${code}/members`, {
          method: "GET",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "No se pudieron cargar los miembros.");
        }

        setFamilyMembers(data.members ?? []);
      } catch (err: any) {
        console.error("[LOGIN] error cargando miembros:", err);
        setMembersError(err.message || "No se pudieron cargar los miembros.");
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [logged, code]);

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
          {logged ? (
            // --- Vista de éxito: perfil + listado de personas ---
            <>
              <header className="mb-6 space-y-2">
                <h1 className="text-white text-2xl sm:text-3xl text-left">
                  👋 Hola de nuevo
                </h1>
                <p className="text-sm text-gray-300">
                  Entraste como{" "}
                  <span className="font-semibold">{logged.member.name}</span> en la
                  familia con código{" "}
                  <span className="font-mono font-semibold text-gray-100">
                    {code}
                  </span>
                  .
                </p>
              </header>

              <section className="space-y-3 text-sm">
                <h2 className="text-sm font-semibold text-gray-100">
                  Personas en este grupo familiar
                </h2>

                <div className="bg-slate-900 rounded-xl p-3 border border-slate-700">
                  {membersLoading ? (
                    <p className="text-sm text-gray-400">Cargando integrantes...</p>
                  ) : membersError ? (
                    <p className="text-sm text-red-400">{membersError}</p>
                  ) : familyMembers.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      Aún no hay otros integrantes creados en esta familia.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {familyMembers.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between text-sm border-b border-slate-800 pb-1 last:border-b-0"
                        >
                          <span
                            className={
                              m.id === logged.member.id
                                ? "font-semibold text-emerald-300"
                                : "text-gray-200"
                            }
                          >
                            {m.name}
                            {m.id === logged.member.id && " (tú)"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <div className="mt-6 space-y-3">
                <button
                  className="w-full py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-gray-100 transition-colors"
                  type="button"
                  onClick={() => router.push(`/f/${code}/perfil`)}
                >
                  Entrar a mi perfil
                </button>

                <Link
                  href={`/f/${code}`}
                  className="block text-center text-sm text-gray-300 hover:text-emerald-400 transition-colors underline"
                >
                  ← Volver a la familia
                </Link>
              </div>
            </>
          ) : (
            // --- Vista de formulario de login ---
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
          )}
        </div>
      </div>
    </div>
  );
}
