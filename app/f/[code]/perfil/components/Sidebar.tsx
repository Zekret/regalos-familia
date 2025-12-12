"use client";

import { Users, Heart, LogOut } from "lucide-react";

interface SidebarProps {
    activeSection: "family" | "wishes";
    onSectionChange: (section: "family" | "wishes") => void;
    memberName?: string;
    familyCode?: string;
    onLogout?: () => void;
}

export function Sidebar({
    activeSection,
    onSectionChange,
    memberName,
    familyCode,
    onLogout,
}: SidebarProps) {
    return (
        <aside className="hidden md:flex w-64 bg-black border-r border-gray-800 flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-white text-lg font-semibold">
                    {memberName ? `Hola, ${memberName}` : "Mi Aplicación"}
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                    {familyCode
                        ? `Código familia: ${familyCode}`
                        : "Bienvenido de nuevo"}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    <li>
                        <button
                            type="button"
                            onClick={() => onSectionChange("family")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === "family"
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                                }`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="text-sm">Lista de familiares</span>
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            onClick={() => onSectionChange("wishes")}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeSection === "wishes"
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                                }`}
                        >
                            <Heart className="w-5 h-5" />
                            <span className="text-sm">Lista de deseos</span>
                        </button>
                    </li>
                </ul>
            </nav>

            {/* Footer */}
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
