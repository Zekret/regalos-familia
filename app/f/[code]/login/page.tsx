"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logged, setLogged] = useState<LoginMemberResponse | null>(null);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

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

  // Vista de éxito: perfil + listado de personas
  if (logged) {
    return (
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-xl font-bold text-center">👋 Hola de nuevo</h1>
          <p className="text-sm text-center text-slate-600">
            Entraste como{" "}
            <span className="font-semibold">{logged.member.name}</span> en la
            familia con código{" "}
            <span className="font-mono font-semibold">{code}</span>.
          </p>
        </header>

        <section className="space-y-3 text-sm text-slate-700">
          <h2 className="text-sm font-semibold text-slate-700">
            Personas en este grupo familiar
          </h2>

          {membersLoading ? (
            <p className="text-sm text-slate-500">Cargando integrantes...</p>
          ) : membersError ? (
            <p className="text-sm text-red-600">{membersError}</p>
          ) : familyMembers.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay otros integrantes creados en esta familia.
            </p>
          ) : (
            <ul className="space-y-1">
              {familyMembers.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-sm border-b border-slate-100 pb-1 last:border-b-0"
                >
                  <span
                    className={
                      m.id === logged.member.id
                        ? "font-semibold text-slate-900"
                        : "text-slate-700"
                    }
                  >
                    {m.name}
                    {m.id === logged.member.id && " (tú)"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-2">
          <button
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition"
            type="button"
            onClick={() => router.push(`/f/${code}/perfil`)}
          >
            Entrar a mi perfil
          </button>

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

  // Vista de formulario de login
  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-center">Ya tengo una lista aquí</h1>
        <p className="text-sm text-center text-slate-600">
          Escribe tu nombre y tu PIN para entrar a tu perfil.
        </p>
        <p className="text-xs text-center text-slate-500">
          Código de la familia:{" "}
          <span className="font-mono font-semibold">{code}</span>
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Tu nombre</label>
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
          {isSubmitting ? "Entrando..." : "Entrar a mi perfil"}
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
