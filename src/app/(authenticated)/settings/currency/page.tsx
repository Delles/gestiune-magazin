// src/app/(authenticated)/settings/currency/page.tsx
import { CurrencySettingsForm } from "./_components/currency-settings-form"; // Import the form component
import { Separator } from "@/components/ui/separator";

export default function CurrencySettingsPage() {
    // Rename function for clarity
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Currency Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Set the default currency used throughout the application.
                </p>
            </div>
            <Separator />
            <CurrencySettingsForm /> {/* Render the currency form component */}
        </div>
    );
}
