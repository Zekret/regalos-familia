// app/page.tsx
import Link from "next/link";
import { Users, LogIn, Gift } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-5 md:mb-6">
            <Gift className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-emerald-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-5 md:mb-6 text-white px-2">
            Lista de deseos navidad 2025
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto text-base sm:text-lg px-4">
            Crea un espacio para tu familia y deja que cada integrante tenga su
            propia lista de regalos, sencilla y fácil de usar.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Crear familia */}
          <Link
            href="/familia/crear"
            className="group block bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h2 className="text-white text-xl sm:text-2xl">
                Crear grupo familiar
              </h2>
            </div>
            <p className="text-emerald-50 text-sm pl-0 sm:pl-18">
              Inicia un nuevo grupo para tu familia y comparte el link o código
              con tus seres queridos.
            </p>
          </Link>

          {/* Ingresar a una familia */}
          <Link
            href="/familia/ingresar"
            className="group block bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-emerald-500/30 hover:border-emerald-500 text-left"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                <LogIn className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <h2 className="text-white text-xl sm:text-2xl">
                Ingresar a un grupo familiar
              </h2>
            </div>
            <p className="text-gray-300 text-sm pl-0 sm:pl-18">
              Únete a un grupo existente usando el link o el código que te
              compartieron.
            </p>
          </Link>
        </div>

        {/* Decorative / extra text */}
        <div className="mt-8 sm:mt-10 md:mt-12 text-center space-y-3 px-4">
          <p className="text-xs sm:text-sm text-slate-300">
            Si te enviaron un link por WhatsApp, puedes pegarlo en{" "}
            <span className="font-semibold">“Ingresar a una familia”</span>.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm">
            Haz que esta navidad sea especial compartiendo deseos con tu familia.
          </p>
        </div>
      </div>
    </div>
  );
}
