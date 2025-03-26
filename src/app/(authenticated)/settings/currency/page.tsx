// src/app/(authenticated)/settings/store-information/page.tsx
// We will create this next
import { Separator } from "@/components/ui/separator";
import { CurrencySettingsForm } from "./_components/currency-settings-form";
export default function StoreInformationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Store Information</h3>
                <p className="text-sm text-muted-foreground">Currency page</p>
            </div>
            <Separator />
            <CurrencySettingsForm />
        </div>
    );
}
