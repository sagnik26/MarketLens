/** Builds TinyFish goal string for extracting reviews with strict JSON schema. */

export function buildReviewsGoal(limit = 10): string {
  return `
Extract the most recent ${limit} reviews from this page.

Return JSON matching this exact schema:
{
  "reviews": [
    {
      "rating":           number,
      "reviewerRole":     string | null,
      "companySizeRange": string | null,
      "pros":             string,
      "cons":             string,
      "summary":          string,
      "postedAt":         string | null
    }
  ],
  "averageRating": number | null,
  "totalReviews":  number | null
}

Rules:
- If a field is missing, use null. Never omit a key.
- Return ONLY valid JSON. No prose. No markdown.
  `.trim();
}
