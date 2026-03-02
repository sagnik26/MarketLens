/** Builds TinyFish goal string for BSE/NSE circulars (daysBack param) with strict JSON schema. */

export function buildComplianceGoal(daysBack = 7): string {
  return `
Find all circulars or notifications published in the last ${daysBack} days on this page.

Return JSON matching this exact schema:
{
  "circulars": [
    {
      "title":          string,
      "circularNumber": string | null,
      "category":       string | null,
      "publishedAt":    string | null,
      "url":            string | null,
      "summary":        string | null
    }
  ],
  "totalFound": number
}

Rules:
- publishedAt should be ISO date string if parseable, else raw text, else null.
- If no circulars found in the date range, return empty circulars array.
- summary is one sentence describing what the circular requires.
- Return ONLY valid JSON. No prose. No markdown.
  `.trim();
}
