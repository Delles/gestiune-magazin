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
import { z } from "zod";
import {
    useState,
    useMemo,
    useRef,
    useEffect,
    type HTMLAttributes,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
 * Zod schema for password update form validation
 * Requires:
 * - Password at least 8 characters
 * - Contains uppercase, lowercase, and number
 * - Confirmation password matches
 */
const updatePasswordFormSchema = z
    .object({
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

/**
 * Type definition for the password update form values
 */
type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>;

// Define the specific props type alias
type UpdatePasswordFormProps = HTMLAttributes<HTMLDivElement>;

/**
 * Form component for updating user password
 *
 * Allows users to set a new password after requesting a password reset.
 * Validates password requirements and handles submission to Supabase.
 *
 * @param {Readonly<UpdatePasswordFormProps>} props - Component props
 * @returns {JSX.Element} The password update form component
 */

export function UpdatePasswordForm({
    className,
    ...props
}: Readonly<UpdatePasswordFormProps>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Initialize form with Zod schema validation
    const form = useForm<UpdatePasswordFormValues>({
        resolver: zodResolver(updatePasswordFormSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    /**
     * Handles form submission to update the user's password
     *
     * @param {UpdatePasswordFormValues} values - The validated form values
     */
    const onSubmit = async (values: UpdatePasswordFormValues) => {
        setIsSubmitting(true);
        setUpdateError(null);

        try {
            // Update password via Supabase Auth API
            const { error } = await supabase.auth.updateUser({
                password: values.password,
            });

            if (!isMountedRef.current) {
                if (process.env.NODE_ENV === "development") {
                    console.log(
                        "Component unmounted before password update response handling."
                    );
                }
                return;
            }

            if (error) {
                setUpdateError(error.message);
            } else {
                // Redirect to login page with success parameter
                router.push("/login?reset=success");
            }
        } catch (error) {
            console.error("Unexpected error during password update:", error);
            if (isMountedRef.current) {
                setUpdateError(
                    "An unexpected error occurred. Please try again."
                );
            } else if (process.env.NODE_ENV === "development") {
                console.log(
                    "Component unmounted before handling password update catch block."
                );
            }
        } finally {
            if (isMountedRef.current) {
                setIsSubmitting(false);
            } else if (process.env.NODE_ENV === "development") {
                console.log(
                    "Component unmounted before password update finally block."
                );
            }
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Update your password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="flex flex-col gap-6"
                        >
                            {/* Display error message if update fails */}
                            {updateError && (
                                <p className="text-sm text-red-500">
                                    {updateError}
                                </p>
                            )}

                            {/* New password field */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="password">
                                            New Password
                                        </FormLabel>
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

                            {/* Confirm password field */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel htmlFor="confirmPassword">
                                            Confirm New Password
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Submit button with loading state */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? "Updating..."
                                    : "Update Password"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
