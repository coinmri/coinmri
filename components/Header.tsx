"use client"

import Link from "next/link"

export function Header() {
  return (
    <div className="mb-8">
      <Link href="/">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          COINMRI DYOR
        </h1>
      </Link>
    </div>
  )
}
