import "@repo/ui/globals.css";
import { cn } from "@repo/ui/lib/utils";
import { Inter, JetBrains_Mono } from "next/font/google";

import "../styles/local.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jet-brains-mono",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={cn(
                    inter.variable,
                    jetbrainsMono.variable,
                    "antialiased",
                )}
            >
                {children}
            </body>
        </html>
    );
}
