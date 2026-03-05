/** Build a goal string for TinyFish tailored to a specific product vs competitor matchup. */

export interface BuildMatchupGoalInput {
  productName: string;
  productSegment?: string | null;
  productPositioning?: string | null;
  productPricingModel?: string | null;
  productUrl?: string | null;
  competitorName: string;
  competitorUrl: string;
  goal: string;
}

export function buildMatchupGoal(input: BuildMatchupGoalInput): string {
  const lines: string[] = [];

  lines.push("You are MarketLens, an AI Product Manager intelligence analyst.");
  lines.push("");
  lines.push("Your task: scan the competitor page and extract insights relative to MY product and MY goal.");
  lines.push("");
  lines.push("## My product");
  lines.push(`- Name: ${input.productName}`);
  if (input.productSegment) lines.push(`- Segment: ${input.productSegment}`);
  if (input.productPositioning) lines.push(`- Positioning: ${input.productPositioning}`);
  if (input.productPricingModel) lines.push(`- Pricing model: ${input.productPricingModel}`);
  if (input.productUrl) lines.push(`- Product URL (context): ${input.productUrl}`);
  lines.push("");

  lines.push("## Competitor");
  lines.push(`- Name: ${input.competitorName}`);
  lines.push(`- URL to scan: ${input.competitorUrl}`);
  lines.push("");

  lines.push("## Goal");
  lines.push(input.goal);
  lines.push("");

  lines.push("## Output format (JSON)");
  lines.push("Return a JSON object with these keys:");
  lines.push("- summary: string (1–3 sentences relevant to the goal)");
  lines.push("- pricing: object | null (if pricing info exists: tiers, prices, packaging notes)");
  lines.push("- messaging: object | null (positioning claims, target audience, differentiators)");
  lines.push("- featureSignals: array (0–10 bullets of notable capability signals)");
  lines.push("- risks: array (0–10 bullets of threats vs my product for the stated goal)");
  lines.push("- opportunities: array (0–10 bullets of gaps I can exploit for the stated goal)");
  lines.push("");
  lines.push("Be specific. Only include claims supported by the scanned page content.");

  return lines.join("\n");
}

