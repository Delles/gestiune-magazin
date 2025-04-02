"use client";

import { useState } from "react";
import EditItemForm from "../../_components/forms/edit-item-form";

interface EditSheetWrapperProps {
    itemId: string;
}

export default function EditSheetWrapper({ itemId }: EditSheetWrapperProps) {
    const [isOpen, setIsOpen] = useState(true);

    const handleSuccess = () => {
        setIsOpen(false);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <EditItemForm
            itemId={itemId}
            onSuccess={handleSuccess}
            onClose={handleClose}
        />
    );
}
