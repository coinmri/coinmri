import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ExchangeData {
  exchange: string
  volume: number
  price: number
  target: string
}

interface ExchangesPanelProps {
  usdtData: ExchangeData[]
  usdData: ExchangeData[]
  symbol: string
}

function ExchangeTable({ data, symbol, target }: { data: ExchangeData[]; symbol: string; target: string }) {
  const [selectedExchange, setSelectedExchange] = useState<ExchangeData | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-800/50">
            <TableHead className="text-blue-400">Exchange</TableHead>
            <TableHead className="text-blue-400">Pair</TableHead>
            <TableHead className="text-right text-blue-400">Volume (USD)</TableHead>
            <TableHead className="text-right text-blue-400">Price (USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={index}
              className="hover:bg-gray-800/40 transition-colors duration-200 cursor-pointer"
              onClick={() => setSelectedExchange(item)}
            >
              <TableCell className="font-medium text-lg text-blue-300">{item.exchange}</TableCell>
              <TableCell className="text-gray-300">
                {symbol.toUpperCase()}/{target}
              </TableCell>
              <TableCell className="text-right text-gray-300">
                {item.volume.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </TableCell>
              <TableCell className="text-right text-gray-300">
                {item.price.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={!!selectedExchange} onOpenChange={() => setSelectedExchange(null)}>
        <DialogContent className="bg-gray-900 text-gray-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-blue-400">{selectedExchange?.exchange}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="mb-2">
              <span className="font-semibold text-blue-400">Pair:</span> {symbol.toUpperCase()}/{target}
            </p>
            <p className="mb-2">
              <span className="font-semibold text-blue-400">Volume:</span>{" "}
              {selectedExchange?.volume.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </p>
            <p className="mb-2">
              <span className="font-semibold text-blue-400">Price:</span>{" "}
              {selectedExchange?.price.toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function ExchangesPanel({ usdtData, usdData, symbol }: ExchangesPanelProps) {
  return (
    <div className="bg-gray-900/70 rounded-lg overflow-hidden backdrop-blur-sm">
      <h3 className="text-2xl font-bold text-blue-400 p-4 border-b border-gray-800/50">
        {symbol.toUpperCase()} Exchange Data
      </h3>
      <Tabs defaultValue="usdt" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
          <TabsTrigger value="usdt" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
            USDT Pairs
          </TabsTrigger>
          <TabsTrigger value="usd" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">
            USD Pairs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="usdt">
          <div className="overflow-x-auto">
            <ExchangeTable data={usdtData} symbol={symbol} target="USDT" />
          </div>
        </TabsContent>
        <TabsContent value="usd">
          <div className="overflow-x-auto">
            <ExchangeTable data={usdData} symbol={symbol} target="USD" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
