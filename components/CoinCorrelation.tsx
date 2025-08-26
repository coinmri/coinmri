import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CoinCorrelationProps {
  coin: string
  correlation24h: string
  correlation30d: string
  error?: string
}

export function CoinCorrelation({ coin, correlation24h, correlation30d, error }: CoinCorrelationProps) {
  if (error) {
    return (
      <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-red-400">Error Fetching Correlation Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-200">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400">Price Correlation for {coin}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-blue-300">Period</TableHead>
              <TableHead className="text-blue-300">Correlation with BTC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-gray-200">Last 24 Hours</TableCell>
              <TableCell className="text-gray-200">{correlation24h}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-200">Last 30 Days</TableCell>
              <TableCell className="text-gray-200">{correlation30d}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
