import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import toolsData from "@/data/tools.json";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a BI/HR consultant advising an international biotech group.
Analyze the HR tools portfolio provided as JSON and produce a structured summary in exactly 4 sections, using markdown headings (##):

## 1. Portfolio overview
## 2. Strengths
## 3. Gaps and blind spots
## 4. Standardization recommendations

Be specific and reference actual tool names, categories, scopes and countries from the data. Keep each section concise (3-5 bullet points or short paragraphs).`;

export async function POST() {
  try {
    const response = await client.beta.messages.create({
      model: "claude-fable-5",
      max_tokens: 4096,
      betas: ["server-side-fallback-2026-06-01"],
      fallbacks: [{ model: "claude-opus-4-8" }],
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the HR tools portfolio (${toolsData.length} tools):\n\n${JSON.stringify(toolsData)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The analysis request was declined. Please try again." },
        { status: 502 }
      );
    }

    const textBlock = response.content.find(
      (block): block is Anthropic.Beta.BetaTextBlock => block.type === "text"
    );

    if (!textBlock) {
      return NextResponse.json(
        { error: "No analysis was returned. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ analysis: textBlock.text });
  } catch (error) {
    console.error("AI Insights generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate insights. Please try again later." },
      { status: 500 }
    );
  }
}
