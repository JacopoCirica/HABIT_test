import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

export default function PrivacyPage() {
  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center px-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span className="text-xl font-bold">HABIT</span>
            </div>
            <div className="ml-auto">
              <Link href="/">
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  Home
                </button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="mx-auto max-w-3xl">
                <h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>
                <div className="prose max-w-none">
                  <p className="lead">
                    At HABIT, we take your privacy seriously. This Privacy Policy explains how we collect, use, and
                    protect your personal information when you use our platform.
                  </p>

                  <h2>Information We Collect</h2>
                  <p>We collect the following types of information:</p>
                  <ul>
                    <li>
                      <strong>Account Information:</strong> Email address used for verification and communication.
                    </li>
                    <li>
                      <strong>Demographic Information:</strong> Age, gender, education level, and occupation provided
                      during the consent process.
                    </li>
                    <li>
                      <strong>Opinion Data:</strong> Responses to opinion surveys on various topics.
                    </li>
                    <li>
                      <strong>Interaction Data:</strong> Messages, responses, and other content created during research
                      sessions.
                    </li>
                    <li>
                      <strong>Usage Data:</strong> Information about how you use our platform, including time spent,
                      features used, and navigation patterns.
                    </li>
                  </ul>

                  <h2>How We Use Your Information</h2>
                  <p>We use the information we collect for the following purposes:</p>
                  <ul>
                    <li>To conduct research on human-AI interactions</li>
                    <li>To improve our platform and services</li>
                    <li>To personalize your experience</li>
                    <li>To communicate with you about your participation</li>
                    <li>To ensure the security and integrity of our platform</li>
                  </ul>

                  <h2>Data Protection</h2>
                  <p>
                    We implement appropriate technical and organizational measures to protect your personal information
                    against unauthorized access, alteration, disclosure, or destruction. All data is anonymized for
                    research purposes, and personally identifiable information is kept separate from research data.
                  </p>

                  <h2>Data Sharing</h2>
                  <p>
                    We may share anonymized, aggregated data with research partners and in academic publications. We do
                    not sell your personal information to third parties. Any sharing of data is done in compliance with
                    applicable data protection laws and research ethics guidelines.
                  </p>

                  <h2>Your Rights</h2>
                  <p>
                    Depending on your location, you may have certain rights regarding your personal information,
                    including:
                  </p>
                  <ul>
                    <li>The right to access your personal information</li>
                    <li>The right to correct inaccurate information</li>
                    <li>The right to delete your information</li>
                    <li>The right to restrict or object to processing</li>
                    <li>The right to data portability</li>
                  </ul>
                  <p>
                    To exercise these rights, please contact us at{" "}
                    <a href="mailto:privacy@habit-research.org">privacy@habit-research.org</a>.
                  </p>

                  <h2>Changes to This Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                    the new Privacy Policy on this page and updating the effective date.
                  </p>

                  <h2>Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us at{" "}
                    <a href="mailto:privacy@habit-research.org">privacy@habit-research.org</a>.
                  </p>

                  <p className="text-sm text-muted-foreground">Last updated: May 21, 2025</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="text-lg font-bold">HABIT</span>
              </div>
              <div className="flex gap-8 text-sm text-muted-foreground">
                <Link href="#about">About</Link>
                <Link href="#research">Research</Link>
                <Link href="#privacy">Privacy</Link>
                <Link href="#terms">Terms</Link>
              </div>
              <div className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} HABIT</div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}
