"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

type MemberList = {
    id: string;
    title: string;
    created_at?: string;
};

type SessionData = {
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

type TabKey = "lists" | "family";

export default function PerfilPage() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);
    const code = segments[1] || "(sin código)";

    const router = useRouter();

    const [session, setSession] = useState<SessionData | null>(null);

    const [lists, setLists] = useState<MemberList[]>([]);
    const [listsLoading, setListsLoading] = useState(true);
    const [listsError, setListsError] = useState<string | null>(null);

    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<TabKey>("lists");

    // 1) Cargar sesión desde localStorage
    useEffect(() => {
        try {
            if (typeof window === "undefined") return;

            const raw = localStorage.getItem("gf_session");
            if (!raw) {
                setListsLoading(false);
                setMembersLoading(false);
                return;
            }

            const parsed: SessionData = JSON.parse(raw);
            setSession(parsed);
            setLists(parsed.lists ?? []);
        } catch (err) {
            console.error("[PERFIL] error leyendo sesión:", err);
            setListsError("Ocurrió un problema al leer tu sesión.");
            setListsLoading(false);
            setMembersLoading(false);
        }
    }, []);

    // 2) Refrescar listas desde el backend
    useEffect(() => {
        const fetchLists = async () => {
            if (!session) return;
            try {
                setListsLoading(true);
                setListsError(null);

                const res = await fetch(`/api/members/${session.member.id}/lists`, {
                    method: "GET",
                });

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(data?.message || "No se pudieron cargar tus listas.");
                }

                setLists(data.lists ?? []);
            } catch (err: any) {
                console.error("[PERFIL] error al cargar listas:", err);
                setListsError(err.message || "No se pudieron cargar tus listas.");
            } finally {
                setListsLoading(false);
            }
        };

        if (session) {
            fetchLists();
        }
    }, [session]);

    // 3) Cargar miembros del grupo familiar
    useEffect(() => {
        const fetchMembers = async () => {
            if (!session) return;
            try {
                setMembersLoading(true);
                setMembersError(null);

                const res = await fetch(`/api/families/${session.familyCode}/members`, {
                    method: "GET",
                });

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                    throw new Error(data?.message || "No se pudieron cargar los integrantes.");
                }

                setFamilyMembers(data.members ?? []);
            } catch (err: any) {
                console.error("[PERFIL] error cargando miembros:", err);
                setMembersError(err.message || "No se pudieron cargar los integrantes.");
            } finally {
                setMembersLoading(false);
            }
        };

        if (session) {
            fetchMembers();
        }
    }, [session]);

    if (!session) {
        return (
            <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-4">
                <p className="text-sm text-slate-600">
                    Necesitas iniciar sesión nuevamente.
                </p>
                <Link
                    href={`/f/${code}/login`}
                    className="block text-center text-sm text-blue-600 hover:underline"
                >
                    Volver al inicio de sesión
                </Link>
            </div>
        );
    }

    const hasLists = lists.length > 0;

    return (
        <div className="w-full max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <aside className="md:w-56 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                    <div className="mb-6">
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                            Menú
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                            {session.member.name}
                        </p>
                        <p className="text-xs text-slate-500">
                            Familia{" "}
                            <span className="font-mono font-semibold">
                                {session.familyCode}
                            </span>
                        </p>
                    </div>

                    <nav className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("lists")}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 ${activeTab === "lists"
                                    ? "bg-slate-900 text-white"
                                    : "hover:bg-slate-100 text-slate-700"
                                }`}
                        >
                            <span>📋</span>
                            <span>Mis listas</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("family")}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 ${activeTab === "family"
                                    ? "bg-slate-900 text-white"
                                    : "hover:bg-slate-100 text-slate-700"
                                }`}
                        >
                            <span>👨‍👩‍👧‍👦</span>
                            <span>Mi grupo familiar</span>
                        </button>
                    </nav>
                </aside>

                {/* Contenido principal */}
                <main className="flex-1 space-y-6">
                    {/* Encabezado */}
                    <section className="space-y-1">
                        <h1 className="text-xl font-bold">
                            {activeTab === "lists" ? "Mis listas" : "Mi grupo familiar"}
                        </h1>
                        <p className="text-sm text-slate-600">
                            {activeTab === "lists"
                                ? "Aquí puedes ver y abrir tus listas de deseos."
                                : "Personas que forman parte de este grupo familiar."}
                        </p>
                    </section>

                    {/* Contenido según pestaña */}
                    {activeTab === "lists" ? (
                        <>
                            {/* Botón crear lista */}
                            <section>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/f/${code}/perfil/nueva-lista`)}
                                    className="w-full md:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
                                >
                                    + Crear nueva lista
                                </button>
                            </section>

                            {/* Listado de listas */}
                            <section className="space-y-3">
                                {listsLoading ? (
                                    <p className="text-sm text-slate-500">Cargando listas...</p>
                                ) : listsError ? (
                                    <p className="text-sm text-red-600">{listsError}</p>
                                ) : !hasLists ? (
                                    <p className="text-sm text-slate-500">
                                        Aún no tienes listas creadas. Usa el botón de arriba para
                                        crear tu primera lista de deseos ✨
                                    </p>
                                ) : (
                                    <ul className="grid gap-4 sm:grid-cols-2">
                                        {lists.map((list) => (
                                            <li
                                                key={list.id}
                                                className="border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {list.title}
                                                    </p>
                                                    {list.created_at && (
                                                        <p className="text-xs text-slate-500">
                                                            Creada el{" "}
                                                            {new Date(
                                                                list.created_at
                                                            ).toLocaleDateString("es-CL")}
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        router.push(`/f/${code}/lista/${list.id}`)
                                                    }
                                                    className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50 transition self-start"
                                                >
                                                    Ver esta lista
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </>
                    ) : (
                        <>
                            {/* Contenido de grupo familiar */}
                            <section className="space-y-3">
                                {membersLoading ? (
                                    <p className="text-sm text-slate-500">
                                        Cargando integrantes...
                                    </p>
                                ) : membersError ? (
                                    <p className="text-sm text-red-600">{membersError}</p>
                                ) : familyMembers.length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        Aún no hay integrantes creados en esta familia.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {familyMembers.map((m) => (
                                            <li
                                                key={m.id}
                                                className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 text-sm"
                                            >
                                                <div>
                                                    <p
                                                        className={
                                                            m.id === session.member.id
                                                                ? "font-semibold text-slate-900"
                                                                : "text-slate-800"
                                                        }
                                                    >
                                                        {m.name}
                                                        {m.id === session.member.id && " (tú)"}
                                                    </p>
                                                    {m.created_at && (
                                                        <p className="text-xs text-slate-500">
                                                            Se unió el{" "}
                                                            {new Date(
                                                                m.created_at
                                                            ).toLocaleDateString("es-CL")}
                                                        </p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </>
                    )}

                    {/* Footer de navegación */}
                    <section>
                        <Link
                            href={`/f/${code}`}
                            className="inline-block text-sm text-blue-600 hover:underline"
                        >
                            ← Volver al espacio familiar
                        </Link>
                    </section>
                </main>
            </div>
        </div>
    );
}
