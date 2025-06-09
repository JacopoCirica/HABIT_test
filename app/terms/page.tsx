import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

export default function TermsPage() {
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
                <h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>
                <div className="prose max-w-none">
                  <p className="lead">
                    Welcome to HABIT. By using our platform, you agree to these Terms of Service. Please read them
                    carefully.
                  </p>

                  <h2>1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using the HABIT platform, you agree to be bound by these Terms of Service and all
                    applicable laws and regulations. If you do not agree with any of these terms, you are prohibited
                    from using or accessing this platform.
                  </p>

                  <h2>2. Research Participation</h2>
                  <p>HABIT is a research platform. By using our services, you understand and agree that:</p>
                  <ul>
                    <li>Your interactions may be recorded and analyzed for research purposes</li>
                    <li>You will provide accurate information during the registration and consent process</li>
                    <li>You will participate in good faith and follow instructions provided</li>
                    <li>You can withdraw from participation at any time</li>
                  </ul>

                  <h2>3. User Accounts</h2>
                  <p>
                    When you create an account with us, you must provide accurate and complete information. You are
                    responsible for maintaining the confidentiality of your account and password and for restricting
                    access to your computer. You agree to accept responsibility for all activities that occur under your
                    account.
                  </p>

                  <h2>4. Acceptable Use</h2>
                  <p>You agree not to use the HABIT platform:</p>
                  <ul>
                    <li>For any unlawful purpose or to violate any laws</li>
                    <li>To harass, abuse, or harm another person</li>
                    <li>To impersonate any person or entity</li>
                    <li>To interfere with or disrupt the platform or servers</li>
                    <li>To collect or track personal information of others</li>
                    <li>To spam, phish, or engage in any other malicious activities</li>
                  </ul>

                  <h2>5. Intellectual Property</h2>
                  <p>
                    The HABIT platform and its original content, features, and functionality are owned by the HABIT
                    research team and are protected by international copyright, trademark, patent, trade secret, and
                    other intellectual property laws.
                  </p>

                  <h2>6. User Content</h2>
                  <p>
                    By submitting content to HABIT, you grant us a worldwide, non-exclusive, royalty-free license to
                    use, reproduce, modify, adapt, publish, translate, and distribute your content in any existing or
                    future media for research and educational purposes.
                  </p>

                  <h2>7. Termination</h2>
                  <p>
                    We may terminate or suspend your account and access to the platform immediately, without prior
                    notice or liability, for any reason, including without limitation if you breach the Terms of
                    Service.
                  </p>

                  <h2>8. Limitation of Liability</h2>
                  <p>
                    In no event shall HABIT, its researchers, affiliates, or partners be liable for any indirect,
                    incidental, special, consequential, or punitive damages resulting from your use of or inability to
                    use the platform.
                  </p>

                  <h2>9. Changes to Terms</h2>
                  <p>
                    We reserve the right to modify or replace these Terms of Service at any time. It is your
                    responsibility to check these Terms periodically for changes.
                  </p>

                  <h2>10. Contact Us</h2>
                  <p>
                    If you have any questions about these Terms, please contact us at{" "}
                    <a href="mailto:terms@habit-research.org">terms@habit-research.org</a>.
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
