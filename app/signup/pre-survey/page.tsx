"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { saveConsentInfo } from "@/lib/actions"
import { PageTransition } from "@/components/page-transition"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedButton } from "@/components/ui/animated-button"

export default function ConsentPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [sex, setSex] = useState("")
  const [education, setEducation] = useState("")
  const [occupation, setOccupation] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !age || !sex || !education || !occupation) return

    setIsSubmitting(true)
    try {
      // Generate a unique user ID for this participant
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      // Store all user information in session storage
      sessionStorage.setItem("userId", userId)
      sessionStorage.setItem("userName", name)
      sessionStorage.setItem("userAge", age)
      sessionStorage.setItem("userSex", sex)
      sessionStorage.setItem("userEducation", education)
      sessionStorage.setItem("userOccupation", occupation)
      
      console.log("Personal information stored in session storage with userId:", userId)
      
      // Still call the server action for any backend processing (optional)
      try {
        await saveConsentInfo({ name, age, sex, education, occupation })
      } catch (error) {
        console.log("Server action failed, but continuing with session storage data:", error)
      }
      
      router.push("/signup/demographics")
    } catch (error) {
      console.error("Error saving consent info:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container mx-auto flex h-16 items-center px-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span className="text-xl font-bold">HABIT</span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <section className="py-12">
            <div className="container mx-auto px-4">
              <FadeIn className="mx-auto max-w-md">
                <div className="mb-8 text-center">
                  <h1 className="mb-2 text-3xl font-bold">Pre-survey</h1>
                  <p className="text-muted-foreground">
                    Please provide the following information to participate in the study
                  </p>
                </div>

                <Card className="mb-6">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                      Your data will be used for research purposes only and will be kept confidential.
                    </p>
                  </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="transition-all duration-200 focus:shadow-sm"
                    />
                    <p className="text-xs text-muted-foreground">This name will be displayed in the chat session</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      placeholder="Enter your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      className="transition-all duration-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex</Label>
                    <Select value={sex} onValueChange={setSex} required>
                      <SelectTrigger id="sex" className="transition-all duration-200 focus:shadow-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation">Job/Occupation</Label>
                    <Input
                      id="occupation"
                      type="text"
                      placeholder="Enter your job or occupation"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      required
                      className="transition-all duration-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education">Education Level</Label>
                    <Select value={education} onValueChange={setEducation} required>
                      <SelectTrigger id="education" className="transition-all duration-200 focus:shadow-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <AnimatedButton
                    type="submit"
                    className="w-full"
                    disabled={!name || !age || !sex || !education || !occupation || isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "I'm ready to begin"}
                  </AnimatedButton>
                </form>
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
