import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, MessageSquare, Users, FileText } from "lucide-react"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { StaggeredList, StaggeredItem } from "@/components/ui/staggered-list"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function Home() {
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
              <Link href="/signup">
                <Button>Enter Platform</Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-24">
            <div className="container mx-auto px-4">
              <FadeIn className="mx-auto max-w-4xl text-center">
                <h1 className="mb-6 text-4xl font-bold md:text-6xl">Human Agent Behavioral Interaction Toolkit</h1>
                <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
                  A platform for studying human-agent interactions through structured conversations and behavioral
                  analysis techniques.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/signup">
                    <AnimatedButton size="lg" className="gap-2">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </AnimatedButton>
                  </Link>
                  <Link href="/about">
                    <AnimatedButton size="lg" variant="outline">
                      Learn More
                    </AnimatedButton>
                  </Link>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
              <StaggeredList className="grid gap-8 md:grid-cols-3">
                <StaggeredItem>
                  <Card className="transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Users className="h-6 w-6" />
                      </div>
                      <CardTitle>1. Sign Up</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Create an account and provide consent to participate in research studies.</p>
                    </CardContent>
                  </Card>
                </StaggeredItem>
                <StaggeredItem>
                  <Card className="transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-6 w-6" />
                      </div>
                      <CardTitle>2. Demographics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Share demographic information to help researchers contextualize interactions.</p>
                    </CardContent>
                  </Card>
                </StaggeredItem>
                <StaggeredItem>
                  <Card className="transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <CardTitle>3. Chat Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Engage in structured conversations with AI agents and other participants.</p>
                    </CardContent>
                  </Card>
                </StaggeredItem>
              </StaggeredList>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-muted">
            <div className="container mx-auto px-4">
              <FadeIn delay={0.2} className="mx-auto max-w-3xl rounded-lg bg-background p-8 text-center shadow-sm">
                <h2 className="mb-4 text-3xl font-bold">Ready to Participate?</h2>
                <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                  Join our research platform today and contribute to the advancement of human-agent interaction studies.
                </p>
                <Link href="/signup">
                  <AnimatedButton size="lg">Enter Platform</AnimatedButton>
                </Link>
              </FadeIn>
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
