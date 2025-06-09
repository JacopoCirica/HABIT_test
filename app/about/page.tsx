import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { PageTransition } from "@/components/page-transition"

export default function AboutPage() {
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
                <h1 className="mb-6 text-3xl font-bold">About HABIT</h1>
                <div className="prose max-w-none">
                  <p className="lead">
                    The Human Agent Behavioral Interaction Toolkit (HABIT) is a research platform designed to study
                    interactions between humans and AI agents in controlled environments.
                  </p>

                  <h2>Our Mission</h2>
                  <p>
                    HABIT aims to advance our understanding of human-AI interactions by providing researchers with tools
                    to conduct structured conversations and analyze behavioral patterns. Our platform facilitates the
                    study of how humans perceive, trust, and collaborate with AI systems.
                  </p>

                  <h2>Research Focus</h2>
                  <p>Our research focuses on several key areas:</p>
                  <ul>
                    <li>Trust dynamics between humans and AI agents</li>
                    <li>Persuasion and opinion change in human-AI dialogues</li>
                    <li>Ethical considerations in human-AI interactions</li>
                    <li>Improving AI systems through better understanding of human behavior</li>
                  </ul>

                  <h2>Platform Features</h2>
                  <p>HABIT provides a comprehensive set of tools for researchers:</p>
                  <ul>
                    <li>Configurable AI confederates with different interaction styles</li>
                    <li>Demographic data collection and analysis</li>
                    <li>Opinion tracking and measurement</li>
                    <li>Structured debate and discussion environments</li>
                    <li>Data visualization and export capabilities</li>
                  </ul>

                  <h2>Contact Us</h2>
                  <p>
                    For more information about HABIT or to inquire about research collaborations, please contact us at{" "}
                    <a href="mailto:info@habit-research.org">info@habit-research.org</a>.
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
