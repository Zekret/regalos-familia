"use client";

import { X, Users, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyName?: string;
    familyCode?: string; // ✅ necesario para navegar a /f/[code]/login
}

export function CreateProfileModal({
    isOpen,
    onClose,
    familyName = "esta familia",
    familyCode,
}: CreateProfileModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleJoinCurrentFamily = () => {
        onClose();
        router.push(`/f/${familyCode}`);
    };

    const handleCreateMyFamily = () => {
        onClose();
        router.push(`/familia/crear`);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-white">Crear perfil familiar</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-400 mb-6">Selecciona cómo deseas crear tu perfil familiar</p>

                    {/* Option 1 */}
                    <button
                        onClick={handleJoinCurrentFamily}
                        className="w-full flex items-start gap-4 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors text-left group"
                    >
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-800 transition-colors">
                            <Users className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-white mb-1">Unirme a familia {familyName}</h3>
                            <p className="text-gray-400 text-sm">
                                Crea tu perfil y únete a esta familia para ver y compartir listas de deseos
                            </p>
                        </div>
                    </button>

                    {/* Option 2 */}
                    <button
                        onClick={handleCreateMyFamily}
                        className="w-full flex items-start gap-4 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition-colors text-left group"
                    >
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-white mb-1">Crear mi propia familia</h3>
                            <p className="text-gray-400 text-sm">
                                Comienza una nueva familia y comparte el enlace con tus seres queridos
                            </p>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button onClick={onClose} className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
