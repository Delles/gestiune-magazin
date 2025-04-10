"use client";

import { useState, useEffect, useRef } from "react";
import EditItemForm from "../../_components/forms/edit-item-form";

interface EditSheetWrapperProps {
    itemId: string;
}

export default function EditSheetWrapper({ itemId }: EditSheetWrapperProps) {
    const [isOpen, setIsOpen] = useState(true);
    const isMounted = useRef(true);

    // Set up effect to track component mount status
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleSuccess = () => {
        if (isMounted.current) {
            setIsOpen(false);
        }
    };

    const handleClose = () => {
        if (isMounted.current) {
            setIsOpen(false);
        }
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
