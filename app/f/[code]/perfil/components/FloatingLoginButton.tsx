"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import { CreateProfileModal } from "./CreateProfileModal";

interface FloatingLoginButtonProps {
    familyName?: string;
    familyCode?: string; // ✅ necesario para unirse a la familia del link
}

export function FloatingLoginButton({ familyName, familyCode }: FloatingLoginButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 md:bottom-8 md:right-8 flex items-center gap-3 px-6 py-3 bg-blue-900 text-white rounded-full shadow-lg hover:bg-blue-800 transition-all hover:scale-105 z-50"
            >
                <LogIn className="w-5 h-5" />
                <span className="font-medium">Crear perfil familiar</span>
            </button>

            <CreateProfileModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                familyName={familyName}
                familyCode={familyCode}
            />
        </>
    );
}
