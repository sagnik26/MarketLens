/** Builds TinyFish goal string for extracting features/capabilities with strict JSON schema. */

export function buildFeaturesGoal(): string {
  return `
Extract all product features or capabilities listed on this page (e.g. features list, product page, capability matrix).

Return JSON matching this exact schema:
{
  "features": [
    {
      "name":        string,
      "category":    string | null,
      "description": string | null,
      "highlighted": boolean
    }
  ],
  "totalFound": number
}

Rules:
- If a field is missing, use null. Never omit a key.
- Return ONLY valid JSON. No prose. No markdown.
  `.trim();
}
