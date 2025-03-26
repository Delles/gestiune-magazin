// src/app/(authenticated)/settings/store-information/page.tsx

import { Separator } from "@/components/ui/separator";

export default function StoreInformationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Store Information</h3>
                <p className="text-sm text-muted-foreground">Categories page</p>
            </div>
            <Separator />
        </div>
    );
}
