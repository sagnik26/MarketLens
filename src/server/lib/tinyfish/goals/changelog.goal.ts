/** Builds TinyFish goal string for extracting changelog entries (last 30 days) with strict JSON schema. */

export function buildChangelogGoal(): string {
  return `
Extract all posts or changelog entries published in the last 30 days.

Return JSON matching this exact schema:
{
  "entries": [
    {
      "title":       string,
      "publishedAt": string | null,
      "url":         string | null,
      "summary":     string,
      "isFeatureAnnouncement": boolean,
      "isPivotSignal":         boolean
    }
  ],
  "totalFound": number
}

Rules:
- isFeatureAnnouncement is true if the entry announces a new product feature.
- isPivotSignal is true if the entry suggests a major strategic direction change.
- summary is one sentence describing what was released or announced.
- Return ONLY valid JSON. No prose. No markdown.
  `.trim();
}
