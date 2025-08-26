import { Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-16 pb-8 flex justify-center">
      <div className="flex items-center text-gray-400">
        <Mail className="mr-2 h-5 w-5" />
        <span className="text-base">
          Contact us at{" "}
          <a
            href="mailto:info@coinmri.com"
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            info@coinmri.com
          </a>
        </span>
      </div>
    </footer>
  )
}
