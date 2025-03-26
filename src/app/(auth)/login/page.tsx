import { LoginForm } from "@/app/(auth)/login/_components/login-form";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader component for the login form
 * Displays while the login form is loading
 *
 * @returns {JSX.Element} The login form skeleton component
 */
function LoginFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    );
}

/**
 * Login page component
 * Renders the login form with a loading skeleton
 *
 * @returns {JSX.Element} The login page component
 */
export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Suspense fallback={<LoginFormSkeleton />}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
