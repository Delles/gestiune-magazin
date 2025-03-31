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
import { useState, useMemo, type HTMLAttributes } from "react";
import { createClient } from "@/lib/supabase/client";
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

/**
 * Zod schema for password reset request form
 * Validates email format
 */
const resetPasswordFormSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

/**
 * Type definition for password reset form values
 */
type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

// Define the specific props type alias
type ResetPasswordFormProps = HTMLAttributes<HTMLDivElement>;

/**
 * Password reset request form component
 *
 * Allows users to request a password reset email by providing their email address.
 * Handles form validation and submission to Supabase auth API.
 *
 * @param {Readonly<ResetPasswordFormProps>} props - Component props
 * @returns {JSX.Element} The password reset request form component
 */
export function ResetPasswordForm({
    className,
    ...props
}: Readonly<ResetPasswordFormProps>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState(false);

    // Memoize the Supabase client
    const supabase = useMemo(() => createClient(), []);

    // Initialize react-hook-form with Zod validation
    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordFormSchema),
        defaultValues: {
            email: "",
        },
    });

    /**
     * Handles form submission to request password reset
     *
     * @param {ResetPasswordFormValues} values - The validated form values
     */
    const onSubmit = async (values: ResetPasswordFormValues) => {
        setIsSubmitting(true);
        setResetError(null);
        setResetSuccess(false);

        try {
            // Request password reset via Supabase Auth API
            const { error } = await supabase.auth.resetPasswordForEmail(
                values.email,
                {
                    redirectTo: `${window.location.origin}/reset-password/update`,
                }
            );

            if (error) {
                setResetError(error.message);
            } else {
                setResetSuccess(true);
            }
        } catch {
            setResetError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Reset your password</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a
                        password reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex flex-col gap-6"
                        >
                            {resetError && (
                                <p className="text-sm text-red-500">
                                    {resetError}
                                </p>
                            )}
                            {resetSuccess && (
                                <p className="text-sm text-green-500">
                                    Password reset instructions have been sent
                                    to your email.
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

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? "Sending..."
                                    : "Send Reset Link"}
                            </Button>

                            <div className="mt-4 text-center text-sm">
                                Remember your password?{" "}
                                <Link
                                    href="/login"
                                    className="underline underline-offset-4 hover:text-primary"
                                >
                                    Back to login
                                </Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
