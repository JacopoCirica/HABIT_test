import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider" // Assuming you have a theme provider

const inter = Inter({ subsets: ["latin"] })

// Define metadata for the application
export const metadata: Metadata = {
  title: "HABIT - Human Agent Behavioral Interaction Toolkit",
  description:
    "A platform for studying human-agent interactions through structured conversations and behavioral analysis techniques.",
  // Open Graph and Twitter Card specific metadata
  openGraph: {
    title: "HABIT Platform",
    description: "Explore human-AI interaction research on the HABIT platform.",
    url: "https://www.habitsimulation.xyz", // Replace with your actual production URL
    siteName: "HABIT",
    images: [
      {
        url: "/placeholder.svg?width=1200&height=630", // Replace with a link to your preview image
        width: 1200,
        height: 630,
        alt: "HABIT Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HABIT Platform",
    description: "Explore human-AI interaction research on the HABIT platform.",
    // images: ['/placeholder.svg?width=1200&height=630'], // Replace with your Twitter card image
  },,
  // You can add other metadata here like icons, manifest, etc.
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
        The <meta> tags defined in the `metadata` object above will be
        automatically rendered by Next.js in the <head> section.
        You don't need to manually add them here unless for very specific cases
        not covered by the Metadata API.
      */}
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
