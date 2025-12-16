"use client";

import Link from "next/link";
import { Users, Heart, LogOut } from "lucide-react";

interface SidebarProps {
    activeSection: "family" | "wishes";
    familyHref?: string;
    wishesHref?: string;
    memberId?: string;
    memberName?: string;
    familyCode?: string;
    onLogout?: () => void;
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

export function Sidebar({
    activeSection,
    familyHref,
    wishesHref,
    memberId,
    memberName,
    familyCode,
    onLogout,
}: SidebarProps) {
    const computedFamilyHref =
        familyHref?.trim() ||
        (familyCode && memberId ? `/f/${familyCode}/perfil/${memberId}?section=family` : "");

    const computedWishesHref =
        wishesHref?.trim() ||
        (familyCode && memberId ? `/f/${familyCode}/perfil/${memberId}?section=wishes` : "");

    const family = safeHref(computedFamilyHref);
    const wishes = safeHref(computedWishesHref);

    return (
        <aside className="hidden md:flex w-64 bg-black border-r border-gray-800 flex-col">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-white text-lg font-semibold">
                    {memberName ? `Hola, ${memberName}` : "Mi Aplicación"}
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                    {familyCode ? `Código familia: ${familyCode}` : "Bienvenido de nuevo"}
                </p>
            </div>

            <nav className="flex-1 p-4">
                <ul className="space-y-2">


                    <li>
                        <Link
                            href={wishes}
                            onClick={preventIfInvalid(computedWishesHref)}
                            aria-disabled={!computedWishesHref?.trim()}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === "wishes"
                                ? "bg-gray-800 text-white"
                                : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                                }`}
                        >
                            <Heart className="w-5 h-5" />
                            <span className="text-sm">Lista de deseos</span>
                        </Link>
                    </li>

                    <li>
                        <Link
                            href={family}
                            onClick={preventIfInvalid(computedFamilyHref)}
                            aria-disabled={!computedFamilyHref?.trim()}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === "family"
                                ? "bg-gray-800 text-white"
                                : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="text-sm">Lista de familiares</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-900 hover:text-gray-200 rounded-lg transition-colors text-sm"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </aside>
    );
}
