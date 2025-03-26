// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/layout/header"; // Import the Header

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Inventory Management System",
    description:
        "A comprehensive system for managing inventory, sales, suppliers, and financial data",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Providers>
                    <div className="relative flex min-h-screen flex-col">
                        <Header /> {/* Add Header here */}
                        <main className="flex-1 container py-6">
                            {" "}
                            {/* Add main content wrapper */}
                            {children}
                        </main>
                        {/* Add Footer Here Later if needed */}
                    </div>
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
