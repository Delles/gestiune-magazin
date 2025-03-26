import { UpdatePasswordForm } from "./_components/update-password-form";

/**
 * Password update page component
 * Renders the password update form centered on the page
 * Used after a user clicks on a password reset link
 *
 * @returns {JSX.Element} The password update page component
 */
export default function UpdatePasswordPage() {
    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <UpdatePasswordForm />
            </div>
        </div>
    );
}
