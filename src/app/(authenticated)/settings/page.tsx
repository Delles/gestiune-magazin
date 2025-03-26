// src/app/(authenticated)/settings/page.tsx
import Link from "next/link";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-medium">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your store settings, user profile, and application
                    preferences.
                </p>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/settings/store-information">
                    <Card className="hover:border-primary transition-colors">
                        <CardHeader>
                            <CardTitle>Store Information</CardTitle>
                            <CardDescription>
                                Manage store name, address, contact, and logo.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/settings/currency">
                    <Card className="hover:border-primary transition-colors">
                        <CardHeader>
                            <CardTitle>Currency Settings</CardTitle>
                            <CardDescription>
                                Set the default currency for financial values.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/settings/categories">
                    <Card className="hover:border-primary transition-colors">
                        <CardHeader>
                            <CardTitle>Inventory Categories</CardTitle>
                            <CardDescription>
                                Manage product categories for inventory
                                organization.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                {/* Add links for Tax, Payment Methods, Profile, Report Options later */}
            </div>
        </div>
    );
}
