/** Builds TinyFish goal string for extracting job postings with strict JSON schema. */

export function buildJobsGoal(): string {
  return `
Extract all open job postings listed on this page.

Return JSON matching this exact schema:
{
  "jobs": [
    {
      "title":               string,
      "department":          string | null,
      "location":            string | null,
      "isRemote":            boolean,
      "postedAt":            string | null,
      "seniorityLevel":      "junior" | "mid" | "senior" | "lead" | "executive" | null,
      "isNewProductSignal":  boolean,
      "productSignalReason": string | null
    }
  ],
  "totalCount": number
}

Rules:
- isNewProductSignal is true if the role suggests a new product area being built.
- productSignalReason explains why, or null if isNewProductSignal is false.
- postedAt should be ISO date string if parseable, else raw text, else null.
- Return ONLY valid JSON. No prose. No markdown.
  `.trim();
}
