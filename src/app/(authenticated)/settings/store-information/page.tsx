// src/app/(authenticated)/settings/store-information/page.tsx
import { StoreInfoForm } from "./_components/store-info-form";
import { Separator } from "@/components/ui/separator";

export default function StoreInformationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Store Information</h3>
                <p className="text-sm text-muted-foreground">
                    Update your store profile details.
                </p>
            </div>
            <Separator />
            <StoreInfoForm />
        </div>
    );
}
