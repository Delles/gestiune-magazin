// login-form.tsx
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

/**
 * Zod schema for login form validation
 * Validates email format and requires password
 */
const loginFormSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

/**
 * Type definition for login form values
 */
type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * Login form component for user authentication
 *
 * Handles user login via Supabase authentication, form validation,
 * and redirects after successful login.
 *
 * @param {object} props - Component props
 * @param {string} [props.className] - Optional CSS class name
 * @returns {JSX.Element} The login form component
 */
export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Memoize the Supabase client to maintain a stable reference
    const supabase = useMemo(() => createClient(), []);

    // Check URL parameters for status messages
    const signupSuccess = searchParams.get("signup") === "success";
    const resetSuccess = searchParams.get("reset") === "success";
    // Get redirect URL if it exists
    const redirectTo = searchParams.get("redirect_to") || "/dashboard";

    /**
     * Log authentication status on component mount (development only)
     */
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            console.log("LoginForm mounted");
            // Test connection
            supabase.auth.getSession().then(({ data, error }) => {
                console.log("Initial auth check:", {
                    hasSession: !!data.session,
                    error: error?.message,
                });
            });
        }
    }, [supabase.auth]);

    // Initialize react-hook-form with Zod validation
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    /**
     * Handles form submission for user login
     *
     * @param {LoginFormValues} values - The validated form values
     */
    const onSubmit = async (values: LoginFormValues) => {
        if (process.env.NODE_ENV === "development") {
            console.log("Login submission started");
        }
        setIsSubmitting(true);
        setLoginError(null);

        const { email, password } = values;

        try {
            if (process.env.NODE_ENV === "development") {
                console.log("Attempting login with email:", email);
            }

            // Attempt to sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (process.env.NODE_ENV === "development") {
                console.log("Login response:", {
                    success: !error,
                    error: error?.message,
                    hasUser: !!data?.user,
                    userId: data?.user?.id,
                });
            }

            if (error) {
                if (process.env.NODE_ENV === "development") {
                    console.error("Login error:", {
                        message: error.message,
                        status: error.status,
                        name: error.name,
                    });
                }
                setLoginError(error.message);
            } else {
                if (process.env.NODE_ENV === "development") {
                    console.log("Login successful:", {
                        userId: data.user?.id,
                        email: data.user?.email,
                    });
                }
                toast.success("Successfully signed in!");
                // Redirect to dashboard or specified redirect URL
                router.push(redirectTo);
            }
        } catch (error) {
            console.error("Unexpected error during login:", error);
            setLoginError("An unexpected error occurred during login.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex flex-col gap-6"
                        >
                            {loginError && (
                                <p className="text-sm text-red-500">
                                    {loginError}
                                </p>
                            )}
                            {signupSuccess && (
                                <p className="text-sm text-green-500">
                                    Signup successful! Please login.
                                </p>
                            )}
                            {resetSuccess && (
                                <p className="text-sm text-green-500">
                                    Password reset successful! Please login with
                                    your new password.
                                </p>
                            )}

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="email">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="m@example.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center">
                                            <FormLabel htmlFor="password">
                                                Password
                                            </FormLabel>
                                            <Link
                                                href="/reset-password"
                                                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                            >
                                                Forgot your password?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <Input
                                                id="password"
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Logging in..." : "Login"}
                            </Button>

                            <div className="mt-4 text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/signup"
                                    className="underline underline-offset-4 hover:text-primary"
                                >
                                    Sign up
                                </Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
