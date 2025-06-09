import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

export default function ResearchPage() {
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
                <h1 className="mb-6 text-3xl font-bold">Research at HABIT</h1>
                <div className="prose max-w-none">
                  <p className="lead">
                    HABIT facilitates cutting-edge research on human-AI interactions through structured conversations
                    and behavioral analysis.
                  </p>

                  <h2>Current Research Projects</h2>
                  <p>Our platform is currently being used in several ongoing research initiatives:</p>

                  <div className="mb-8 rounded-lg border p-6">
                    <h3 className="text-xl font-semibold">Opinion Dynamics in Human-AI Debates</h3>
                    <p className="mb-2 text-muted-foreground">
                      Investigating how AI-driven debates influence human opinions on controversial topics.
                    </p>
                    <ul className="mt-4">
                      <li>Measuring opinion shifts during structured debates</li>
                      <li>Analyzing persuasion techniques and their effectiveness</li>
                      <li>Comparing different AI interaction styles</li>
                    </ul>
                  </div>

                  <div className="mb-8 rounded-lg border p-6">
                    <h3 className="text-xl font-semibold">Trust Formation in Human-Agent Interactions</h3>
                    <p className="mb-2 text-muted-foreground">
                      Studying how humans develop trust in AI systems through repeated interactions.
                    </p>
                    <ul className="mt-4">
                      <li>Identifying key factors that influence trust development</li>
                      <li>Measuring trust resilience after AI errors</li>
                      <li>Developing models to predict trust dynamics</li>
                    </ul>
                  </div>

                  <div className="mb-8 rounded-lg border p-6">
                    <h3 className="text-xl font-semibold">Ethical AI Interaction Design</h3>
                    <p className="mb-2 text-muted-foreground">
                      Exploring ethical frameworks for designing AI systems that interact with humans.
                    </p>
                    <ul className="mt-4">
                      <li>Developing guidelines for transparent AI interactions</li>
                      <li>Testing user responses to different disclosure methods</li>
                      <li>Measuring the impact of AI transparency on user experience</li>
                    </ul>
                  </div>

                  <h2>Participate in Research</h2>
                  <p>
                    We're always looking for participants to help advance our understanding of human-AI interactions. By
                    participating in HABIT studies, you contribute to important research while experiencing cutting-edge
                    AI technology.
                  </p>
                  <p>
                    To participate, simply create an account on our platform and complete the demographic survey. You'll
                    then be matched with appropriate research studies based on your profile.
                  </p>

                  <h2>For Researchers</h2>
                  <p>
                    If you're a researcher interested in using the HABIT platform for your studies, please contact us at{" "}
                    <a href="mailto:research@habit-research.org">research@habit-research.org</a> for more information
                    about collaboration opportunities.
                  </p>
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
