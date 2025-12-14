"use client";

import { Share2, Link as LinkIcon, Check, X } from "lucide-react";
import { useState } from "react";

interface FloatingShareButtonProps {
    url: string;
    title?: string;
    description?: string;
}

export function FloatingShareButton({
    url,
    title = "Compartir",
    description = "Comparte este enlace",
}: FloatingShareButtonProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    async function handleShare() {
        if (!url) return;

        try {
            // Web Share API (mobile)
            if (typeof navigator !== "undefined" && (navigator as any).share) {
                await (navigator as any).share({
                    title,
                    text: description,
                    url,
                });
                return;
            }

            // Clipboard fallback
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = url;
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // silencioso
        }
    }

    return (
        <>
            {/* FAB */}
            <button
                onClick={() => setOpen(true)}
                className="fixed top-6 right-6 md:top-8 md:right-8 flex items-center gap-3 px-5 py-3
                   bg-gray-800 text-white rounded-full shadow-lg
                   hover:bg-gray-700 transition-all hover:scale-105 z-50"
            >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Compartir</span>
            </button>

            {/* Panel compartir */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
                    {/* Overlay */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-black/60"
                        aria-label="Cerrar"
                    />

                    {/* Card */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative mt-16 w-full max-w-sm bg-slate-900
                       border border-slate-700 rounded-2xl shadow-2xl p-4"
                    >
                        {/* Close */}
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-800 text-gray-300"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <p className="text-white font-semibold flex items-center gap-2 mb-2">
                            <LinkIcon className="w-4 h-4" />
                            Compartir vínculo
                        </p>

                        <p className="break-all text-xs text-gray-100 bg-slate-950
                          rounded-lg p-2 border border-slate-700">
                            {url}
                        </p>

                        <button
                            onClick={handleShare}
                            className="mt-4 w-full bg-white text-slate-900 rounded-xl py-2.5
                         hover:bg-gray-100 transition-colors"
                        >
                            {typeof navigator !== "undefined" && (navigator as any).share
                                ? "Compartir"
                                : "Copiar enlace"}
                        </button>

                        {copied && (
                            <p className="mt-2 text-emerald-400 text-xs flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Enlace copiado
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
