// app/familia/ingresar/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function IngresarFamiliaPage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleClose = () => {
    // Puedes cambiar a router.push("/familia/crear") si quieres otra pantalla
    router.push("/");
  };

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

    // Validación básica de formato
    if (!/^[A-Za-z0-9]{3,10}$/.test(code)) {
      setError("El código familiar no parece válido.");
      return;
    }

    router.push(`/f/${code}`);
  };

  const goToCreateFamily = () => {
    router.push("/familia/crear");
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

        {/* Contenido */}
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-white text-2xl sm:text-3xl mb-2">
              Ingresar a grupo familiar
            </h2>
            <p className="text-gray-400 text-sm">
              Escribe el código familiar o pega el enlace que te enviaron por WhatsApp.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Código o enlace"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-slate-900 text-white placeholder-gray-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <p className="text-gray-400 text-xs mt-2 px-1">
                Ejemplo: ABC123 o https://tusitio.com/f/ABC123
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-white text-slate-900 rounded-xl py-3.5 hover:bg-gray-100 transition-colors mt-4"
            >
              Entrar
            </button>
          </form>

          {/* Switch a crear grupo */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              ¿Aún no tienes un grupo familiar?{" "}
              <button
                type="button"
                onClick={goToCreateFamily}
                className="text-white hover:text-emerald-400 transition-colors underline"
              >
                Crear grupo familiar
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
