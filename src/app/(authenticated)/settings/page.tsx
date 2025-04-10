// src/app/(authenticated)/settings/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Store, Library } from "lucide-react"; // Removed unused: Settings, CreditCard

export default function SettingsPage() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Store Information Card */}
                <Card>
                    <CardHeader>
                        <Store className="mb-2 h-6 w-6" />
                        <CardTitle>Store Information</CardTitle>
                        <CardDescription>
                            Update your store&apos;s name, address, and contact
                            details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/settings/store-information">
                                Manage Store
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Categories Card */}
                <Card>
                    <CardHeader>
                        <Library className="mb-2 h-6 w-6" />
                        <CardTitle>Categories</CardTitle>
                        <CardDescription>
                            Manage product categories for organization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/settings/categories">
                                Manage Categories
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Currency Settings Card - Removed */}

                {/* Add more settings cards here as needed */}
                {/* Example: Payment Gateway Card */}
                {/*
                <Card>
                    <CardHeader>
                        <CreditCard className="mb-2 h-6 w-6" />
                        <CardTitle>Payment Gateway</CardTitle>
                        <CardDescription>
                            Configure your payment processing options.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/settings/payment">Configure Gateway</Link>
                        </Button>
                    </CardContent>
                </Card>
                */}
            </div>
        </div>
    );
}
