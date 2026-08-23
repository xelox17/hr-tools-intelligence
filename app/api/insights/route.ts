import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { tools } from '@/lib/analytics';

const client = new Anthropic();

export async function POST() {
  try {
    const toolsSummary = tools.map((t) => ({
      name: t.name,
      category: t.category,
      scope: t.scope,
      country: t.country,
      description: t.shortDescription,
    }));

    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 8192,
      system:
        "You are a BI analyst reviewing a company's HR tools portfolio. " +
        'Write a structured markdown analysis with ## sections covering: ' +
        'current state, strengths, gaps, and standardization opportunities. ' +
        'Keep paragraphs short and use bullet lists where helpful.',
      messages: [
        {
          role: 'user',
          content: `Here is the HR tools portfolio (${toolsSummary.length} tools):\n\n${JSON.stringify(
            toolsSummary,
            null,
            2
          )}\n\nGenerate the BI-style analysis.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    return NextResponse.json({ analysis: textBlock?.text ?? '' });
  } catch (error) {
    console.error('❌ Insights generation failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate insights.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
