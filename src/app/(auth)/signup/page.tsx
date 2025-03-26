import { SignupForm } from "@/app/(auth)/signup/_components/signup-form";

/**
 * Signup page component
 * Renders the signup form centered on the page
 *
 * @returns {JSX.Element} The signup page component
 */
export default function SignupPage() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <SignupForm />
            </div>
        </div>
    );
}
