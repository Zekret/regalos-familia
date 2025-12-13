interface UserProfileProps {
    name: string;
}

export function UserProfile({ name }: UserProfileProps) {
    return (
        <div className="flex flex-col items-center mb-8 md:mb-12 py-6">
            {/* Avatar */}
            <div className="mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-linear-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white">
                    <span className="text-3xl md:text-4xl font-semibold">
                        {name.charAt(0).toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Name */}
            <h2 className="text-white text-lg md:text-xl font-semibold">
                {name}
            </h2>
        </div>
    );
}
