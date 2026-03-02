/** Builds TinyFish goal string for extracting pricing plans with strict JSON schema. */

export function buildPricingGoal(): string {
  return `
Extract all pricing plans from this page.

Return JSON matching this exact schema:
{
  "plans": [
    {
      "name":           string,
      "monthlyPrice":   number | null,
      "annualPrice":    number | null,
      "currency":       string,
      "features":       string[],
      "usageLimits":    string | null,
      "ctaText":        string | null,
      "isPopular":      boolean
    }
  ],
  "hasPricingHidden": boolean,
  "hiddenNote":       string | null
}

Rules:
- If monthly price is not shown, return null for monthlyPrice.
- If pricing requires contacting sales, set hasPricingHidden to true.
- features must be an array of strings, never a single string.
- Strip currency symbols — price values must be numbers.
- Return ONLY valid JSON. No prose. No markdown.
  `.trim();
}
