import { NextResponse } from "next/server"
import { getProductionConfigHealth } from "@/lib/env"

export async function GET() {
  const health = getProductionConfigHealth()

  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
  })
}
