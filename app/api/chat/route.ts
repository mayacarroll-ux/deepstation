import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";

import { serverEnvironment } from "@/lib/config";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!serverEnvironment.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is required to use the chat endpoint." },
      { status: 503 }
    );
  }

  const requestBody = (await request.json()) as { messages?: UIMessage[] };
  const incomingMessages = requestBody.messages ?? [];
  const modelMessages = await convertToModelMessages(incomingMessages);

  const result = streamText({
    model: openai("gpt-5-mini"),
    system:
      "You are Deepstation, a concise assistant that helps users summarize time entries, identify project focus, and prepare work reports.",
    messages: modelMessages
  });

  return result.toUIMessageStreamResponse();
}
