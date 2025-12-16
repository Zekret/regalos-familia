"use client";

import Link from "next/link";
import React from "react";
import { Users, Heart } from "lucide-react";

interface MobileNavProps {
    activeSection: "family" | "wishes";
    familyHref: string;
    wishesHref: string;

    // ✅ Nuevo: true solo cuando estás viendo TUS listas
    isViewingOwnWishes?: boolean;
}

function safeHref(href?: string) {
    const v = (href ?? "").trim();
    return v.length > 0 ? v : "#";
}

function preventIfInvalid(href?: string) {
    const v = (href ?? "").trim();
    return (e: React.MouseEvent) => {
        if (!v) e.preventDefault();
    };
}

export function MobileNav({
    activeSection,
    familyHref,
    wishesHref,
    isViewingOwnWishes = true,
}: MobileNavProps) {
    const family = safeHref(familyHref);
    const wishes = safeHref(wishesHref);

    // ✅ estados activos correctos
    const isWishesActive = activeSection === "wishes" && isViewingOwnWishes;
    const isFamilyActive = activeSection === "family";

    return (
        <nav className="mobile-nav md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
            <div className="flex items-center justify-around">
                <Link
                    href={wishes}
                    onClick={preventIfInvalid(wishesHref)}
                    aria-disabled={!wishesHref?.trim()}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${isWishesActive
                            ? "text-white"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                >
                    <Heart className="w-6 h-6" />
                    <span className="text-xs">Deseos</span>
                </Link>

                <Link
                    href={family}
                    onClick={preventIfInvalid(familyHref)}
                    aria-disabled={!familyHref?.trim()}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${isFamilyActive
                            ? "text-white"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                >
                    <Users className="w-6 h-6" />
                    <span className="text-xs">Familiares</span>
                </Link>
            </div>
        </nav>
    );
}
