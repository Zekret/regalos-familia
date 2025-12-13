import { useState } from "react";
import { WishItem } from "../components/WishListDetail";

export function useWishItemModal() {
    const [open, setOpen] = useState(false);
    const [item, setItem] = useState<WishItem | null>(null);

    function openModal(selected: WishItem) {
        setItem(selected);
        setOpen(true);
    }

    function closeModal() {
        setOpen(false);
        setItem(null);
    }

    return {
        open,
        item,
        openModal,
        closeModal,
    };
}
