// app/api/chat/route.ts
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const signal = req.signal;

    // Parse the request body
    const {
      messages,
      model,
      apiKey,
      systemPrompt,
      temperature,
      topP,
      topK,
      maxTokens,
      headers = [],
    } = await req.json();

    // Validate required fields
    if (!messages || !model || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine provider and create appropriate client
    const isAnthropicModel = model.provider === "anthropic";
    const modelClient = isAnthropicModel
      ? createAnthropic({ apiKey })(model.id)
      : createOpenAI({ apiKey })(model.id);

    // Calculate safe max tokens based on model
    let safeMaxTokens = maxTokens;
    if (model.id.includes("claude-3-7")) {
      safeMaxTokens = Math.min(maxTokens, 30000);
    } else {
      safeMaxTokens = Math.min(maxTokens, 8192);
    }

    // Prepare custom headers if provided
    const customHeaders: { [key: string]: string } = {};
    if (headers && headers.length > 0) {
      (headers as { key: string; value: string }[]).forEach(
        ({ key, value }) => {
          if (key && value) {
            customHeaders[key] = value;
          }
        }
      );
    }

    // Create stream response
    const { textStream } = streamText({
      model: modelClient,
      messages,
      system: systemPrompt || undefined,
      temperature,
      topP,
      ...(isAnthropicModel ? { topK } : {}),
      maxTokens: safeMaxTokens,
      abortSignal: signal,
    });

    // Create a stream response from the textStream
    let encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Process the text stream
        for await (const chunk of textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
      cancel() {
        // Handle cancellation
        console.log("Stream was canceled by the client");
      },
    });

    // Return the stream as a response
    return new Response(stream);
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message || "Internal server error"
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
