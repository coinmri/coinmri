import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CorrelationData {
  coin: string
  correlation: number
  price: number
}

interface CoinCorrelationTableProps {
  data: CorrelationData[]
  baseCoin: string
}

export function CoinCorrelationTable({ data, baseCoin }: CoinCorrelationTableProps) {
  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-blue-400">
          {baseCoin.toUpperCase()} Price Correlation (90 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-blue-300 font-semibold">Coin</TableHead>
              <TableHead className="text-right text-blue-300 font-semibold">Correlation</TableHead>
              <TableHead className="text-right text-blue-300 font-semibold">Current Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.coin} className="hover:bg-gray-800/50">
                <TableCell className="font-medium text-white">{item.coin.toUpperCase()}</TableCell>
                <TableCell className="text-right text-white">{item.correlation.toFixed(4)}</TableCell>
                <TableCell className="text-right text-white">${item.price.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
