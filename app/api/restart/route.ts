import { NextResponse } from "next/server"

export async function GET() {
  // In a serverless environment, we can't actually restart the server.
  // Instead, we'll log a message and return a response.
  console.log('Server "restart" triggered at', new Date().toISOString())
  return NextResponse.json({ message: 'Server "restart" triggered' })
}
