"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function IngresarFamiliaPage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = input.trim();

    if (!value) {
      setError("Por favor escribe el código o pega el enlace de tu familia.");
      return;
    }

    let code = value;

    // Si pegaron un link completo, intentamos extraer el código
    // Ej: https://misregalos.com/f/ABC123
    const match = value.match(/\/f\/([A-Za-z0-9]+)/);
    if (match && match[1]) {
      code = match[1];
    }

    // Validación muy básica de formato (3 letras + 3 números, opcional)
    if (!/^[A-Za-z0-9]{3,10}$/.test(code)) {
      setError("El código familiar no parece válido.");
      return;
    }

    router.push(`/f/${code}`);
  };

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-center">Ingresar a una familia</h1>
        <p className="text-sm text-center text-slate-600">
          Escribe el código familiar o pega el enlace que te enviaron por WhatsApp.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Código o enlace
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: ABC123 o https://tusitio.com/f/ABC123"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>

      <Link
        href="/"
        className="block text-center text-sm text-blue-600 hover:underline"
      >
        ← Volver al inicio
      </Link>
    </div>
  );
}
