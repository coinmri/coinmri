import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function RateLimitMessage() {
  return (
    <Card className="bg-green-900/70 border-green-800/50 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center space-y-4 p-6">
        <AlertCircle className="h-10 w-10 text-green-400" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-400">Rate Limit Reached</h3>
          <p className="text-green-200 mb-4">
            Free version is limited to a few requests per minute. Upgrade to Premium for unlimited access.
          </p>
          <Link href="/#premium">
            <Button className="bg-green-600 hover:bg-green-700">Upgrade to Premium</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
