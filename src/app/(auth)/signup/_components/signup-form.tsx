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
import {
    useState,
    useEffect,
    useMemo,
    useRef,
    type HTMLAttributes,
} from "react";
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

/**
 * Zod schema for signup form validation
 * Requires:
 * - Valid email format
 * - Password with minimum length and complexity requirements
 * - Matching password confirmation
 */
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

/**
 * Type definition for signup form values
 */
type SignupFormValues = z.infer<typeof signupFormSchema>;

// Define the specific props type alias
type SignupFormProps = HTMLAttributes<HTMLDivElement>;

/**
 * Signup form component for user registration
 *
 * Handles new user registration via Supabase authentication,
 * form validation, and redirects after successful signup.
 *
 * @param {Readonly<SignupFormProps>} props - Component props
 * @returns {JSX.Element} The signup form component
 */
export function SignupForm({ className, ...props }: Readonly<SignupFormProps>) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signupError, setSignupError] = useState<string | null>(null);
    const [showPasswordRequirements, setShowPasswordRequirements] =
        useState(false);
    const router = useRouter();
    const isMountedRef = useRef(true);

    // Memoize the Supabase client
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    /**
     * Log authentication status on component mount (development only)
     */
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            console.log("SignupForm mounted");
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
    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupFormSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    /**
     * Handles form submission for user registration
     *
     * @param {SignupFormValues} values - The validated form values
     */
    const onSubmit = async (values: SignupFormValues) => {
        console.log("Form submission started");
        setIsSubmitting(true);
        setSignupError(null);

        const { email, password } = values;

        try {
            console.log("Attempting signup with email:", email);

            // Register new user with Supabase
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (!isMountedRef.current) {
                if (process.env.NODE_ENV === "development") {
                    console.log(
                        "Component unmounted before signup response handling."
                    );
                }
                return;
            }

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
                // Redirect to login page with success parameter
                router.push("/login?signup=success");
            }
        } catch (error) {
            console.error("Unexpected error during signup:", error);
            if (isMountedRef.current) {
                setSignupError("An unexpected error occurred during signup.");
            } else if (process.env.NODE_ENV === "development") {
                console.log(
                    "Component unmounted before handling signup catch block."
                );
            }
        } finally {
            if (isMountedRef.current) {
                setIsSubmitting(false);
            } else if (process.env.NODE_ENV === "development") {
                console.log("Component unmounted before signup finally block.");
            }
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
