// signup-form.tsx
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
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
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

interface PasswordRequirement {
    text: string;
    regex: RegExp;
}

const passwordRequirements: PasswordRequirement[] = [
    { text: "At least 8 characters", regex: /.{8,}/ },
    { text: "One uppercase letter", regex: /[A-Z]/ },
    { text: "One lowercase letter", regex: /[a-z]/ },
    { text: "One number", regex: /\d/ },
];

// Define the form schema with Zod
const signupFormSchema = z
    .object({
        email: z.string().email("Please enter a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
                "Password must contain at least one uppercase letter, one lowercase letter, and one number"
            ),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// Infer the type from schema
type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signupError, setSignupError] = useState<string | null>(null);
    const [showPasswordRequirements, setShowPasswordRequirements] =
        useState(false);
    const router = useRouter();

    // Log when the component mounts
    useEffect(() => {
        console.log("SignupForm mounted");
        const supabase = createClient();
        // Test connection
        supabase.auth.getSession().then(({ data, error }) => {
            console.log("Initial auth check:", {
                hasSession: !!data.session,
                error: error?.message,
            });
        });
    }, []);

    // Initialize react-hook-form
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupFormSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    // Handle form submission
    const onSubmit = async (values: SignupFormValues) => {
        console.log("Form submission started");
        setIsSubmitting(true);
        setSignupError(null);

        const { email, password } = values;

        try {
            console.log("Attempting signup with email:", email);
            const supabase = createClient();

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            console.log("Signup response:", {
                success: !error,
                error: error?.message,
                hasUser: !!data?.user,
                userId: data?.user?.id,
            });

            if (error) {
                console.error("Signup error:", {
                    message: error.message,
                    status: error.status,
                    name: error.name,
                });
                setSignupError(error.message);
            } else {
                console.log("Signup successful:", {
                    userId: data.user?.id,
                    email: data.user?.email,
                });
                router.push("/login?signup=success");
            }
        } catch (error) {
            console.error("Unexpected error during signup:", {
                error,
                message:
                    error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            });
            setSignupError("An unexpected error occurred during signup.");
        } finally {
            setIsSubmitting(false);
            console.log("Form submission completed");
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex flex-col gap-6"
                        >
                            {signupError && (
                                <p className="text-sm text-red-500">
                                    {signupError}
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
                                        <FormLabel htmlFor="password">
                                            Password
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                id="password"
                                                type="password"
                                                onFocus={() =>
                                                    setShowPasswordRequirements(
                                                        true
                                                    )
                                                }
                                                {...field}
                                                onBlur={(e) => {
                                                    field.onBlur();
                                                    if (
                                                        !e.relatedTarget?.id?.includes(
                                                            "password"
                                                        )
                                                    ) {
                                                        setShowPasswordRequirements(
                                                            false
                                                        );
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        {showPasswordRequirements && (
                                            <div className="mt-2 space-y-2">
                                                {passwordRequirements.map(
                                                    (req, index) => {
                                                        const isMet =
                                                            req.regex.test(
                                                                field.value
                                                            );
                                                        return (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-2 text-sm"
                                                            >
                                                                {isMet ? (
                                                                    <Check className="h-4 w-4 text-green-500" />
                                                                ) : (
                                                                    <X className="h-4 w-4 text-red-500" />
                                                                )}
                                                                <span
                                                                    className={
                                                                        isMet
                                                                            ? "text-green-500"
                                                                            : "text-red-500"
                                                                    }
                                                                >
                                                                    {req.text}
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="confirmPassword">
                                            Confirm Password
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                {...field}
                                                onBlur={(e) => {
                                                    field.onBlur();
                                                    if (
                                                        !e.relatedTarget?.id?.includes(
                                                            "password"
                                                        )
                                                    ) {
                                                        setShowPasswordRequirements(
                                                            false
                                                        );
                                                    }
                                                }}
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
                                {isSubmitting
                                    ? "Creating account..."
                                    : "Sign up"}
                            </Button>

                            <div className="mt-4 text-center text-sm">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="underline underline-offset-4 hover:text-primary"
                                >
                                    Login
                                </Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
