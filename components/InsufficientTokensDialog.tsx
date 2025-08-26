"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BuyTokensCard } from "./BuyTokensCard"

interface InsufficientTokensDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InsufficientTokensDialog({ open, onOpenChange, onSuccess }: InsufficientTokensDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Insufficient COINMRI Tokens</DialogTitle>
        </DialogHeader>
        <BuyTokensCard onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  )
}
