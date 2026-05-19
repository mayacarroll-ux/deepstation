import type { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { assertProductionServerEnvironment } from "@/lib/config";

export async function GET(request: NextRequest) {
  assertProductionServerEnvironment();

  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  assertProductionServerEnvironment();

  return handlers.POST(request);
}
