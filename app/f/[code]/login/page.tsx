"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./components/Sidebar";
import { FamilyList } from "./components/FamilyList";

type Session = {
  familyCode: string;
  member: {
    id: string;
    name: string;
  };
  token: string;
  // si tienes más campos en LoginMemberResponse y los necesitas, los agregas acá
};

export default function App() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"family" | "wishes">("family");

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gf_session");
      if (!raw) {
        setSessionError("No se encontró la sesión. Vuelve a iniciar sesión.");
        setSessionLoading(false);
        return;
      }
      const parsed = JSON.parse(raw) as Session;
      setSession(parsed);
      setSessionLoading(false);
    } catch (err) {
      console.error("Error leyendo gf_session:", err);
      setSessionError("Ocurrió un problema al leer tu sesión.");
      setSessionLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("gf_session");
    // aquí puedes redirigir a la página de la familia o a home
    router.push("/"); // o `/f/${session?.familyCode}`
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando sesión...</p>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 px-4 py-3 rounded-xl max-w-sm text-center">
          {sessionError ?? "No hay sesión activa. Vuelve a iniciar sesión."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        memberName={session.member.name}
        familyCode={session.familyCode}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-auto bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        {activeSection === "family" && (
          <FamilyList
            familyCode={session.familyCode}
            currentMemberId={session.member.id}
          />
        )}

        {/* {activeSection === "wishes" && (
          <WishList
            familyCode={session.familyCode}
            token={session.token}
            memberId={session.member.id}
          />
        )} */}
      </main>
    </div>
  );
}
