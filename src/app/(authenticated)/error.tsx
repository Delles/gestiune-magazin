"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AuthErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function AuthError({ error, reset }: Readonly<AuthErrorProps>) {
    useEffect(() => {
        console.error(
            "Authenticated Area ErrorBoundary caught an error:",
            error
        );
        // Example: Sentry?.captureException(error);
    }, [error]);

    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                    <CardTitle>Application Error</CardTitle>
                    <CardDescription>
                        An unexpected error occurred within this section. Please
                        try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    {process.env.NODE_ENV === "development" && (
                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {error?.message || "No error message available."}
                        </p>
                    )}
                    <Button onClick={() => reset()}>Try again</Button>
                </CardContent>
            </Card>
        </div>
    );
}
