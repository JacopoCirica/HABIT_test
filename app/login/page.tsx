"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to signup page
    router.push("/signup")
  }, [router])

  return null
}
