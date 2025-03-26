import { ResetPasswordForm } from "./_components/reset-password-form";

/**
 * Password reset request page component
 * Renders the password reset request form centered on the page
 *
 * @returns {JSX.Element} The password reset request page component
 */
export default function ResetPasswordPage() {
    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <ResetPasswordForm />
            </div>
        </div>
    );
}
