// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-center">
          🎁 Listas de deseos familiares
        </h1>
        <p className="text-sm text-center text-slate-600">
          Crea un espacio para tu familia y deja que cada integrante tenga su
          propia lista de regalos, sencilla y fácil de usar.
        </p>
      </header>

      <div className="space-y-3">
        <Link
          href="/familia/crear"
          className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition"
        >
          Crear familia
        </Link>

        <Link
          href="/familia/ingresar"
          className="block w-full text-center py-3 rounded-xl border border-slate-300 font-semibold text-base hover:bg-slate-100 transition"
        >
          Ingresar a una familia
        </Link>
      </div>

      <p className="text-xs text-center text-slate-500">
        Si te enviaron un link por WhatsApp, puedes pegarlo en{" "}
        <span className="font-semibold">“Ingresar a una familia”</span>.
      </p>
    </div>
  );
}
