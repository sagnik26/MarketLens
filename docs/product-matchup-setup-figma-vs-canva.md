# Product Matchup Setup: Figma vs Canva

Use this to create a **Figma vs Canva** product matchup and run a features-focused scan.

---

## Step 1: Add Canva as a competitor (if not already)

1. Go to **Dashboard → Actions → Competitor Radar**.
2. Add a competitor:
   - **Name:** `Canva`
   - **Website:** `https://www.canva.com`
   - **Logo URL:** (optional) leave blank or use e.g. `https://static.canva.com/web/images/icon.svg`
3. Save. Note: you’ll select “Canva” in the Product Matchups form.

If you prefer to use the API:

```json
POST /api/v1/competitors
{
  "name": "Canva",
  "website": "https://www.canva.com"
}
```

---

## Step 2: Create the product matchup

1. Go to **Dashboard → Actions → Product Matchups**.
2. Click **Add product matchup** (+).
3. Fill the form with the values below.

### Your product (Figma)

| Field | Value |
|--------|--------|
| **Product name** | `Figma` |
| **Product segment** | `Design & collaboration` |
| **Product positioning** | `Collaborative interface design tool for teams; browser-first, real-time multiplayer` |
| **Product pricing model** | `Freemium; paid tiers by editor count and advanced features` |
| **Product URL** | `https://www.figma.com/design/` |

### Competitor & goal

| Field | Value |
|--------|--------|
| **Competitor** | Select **Canva** from the dropdown |
| **Target segment** (optional) | `Design teams and non-designers (SMB to enterprise)` |
| **Competitor URL** | `https://www.canva.com/features/` |
| **Goal** | `Compare feature set and positioning for design tools. Identify where Figma leads (e.g. collaboration, dev handoff) and where Canva leads (e.g. templates, ease of use) so we can sharpen messaging and roadmap priorities.` |

4. Submit the form to create the matchup.

---

## Step 3: Run a scan

1. In the Product Matchups list, find **Figma vs Canva**.
2. Click **Run scan** (or the scan button for that matchup).
3. The app will scan the **Competitor URL** (`https://www.canva.com/features/`) using the **Product** channel (stealth). Results appear under **Information** and **Insights** for that matchup.

---

## Copy-paste summary

**Competitor (add first in Competitor Radar)**  
- Name: `Canva`  
- Website: `https://www.canva.com`

**Product matchup form**  
- Product name: `Figma`  
- Product segment: `Design & collaboration`  
- Product positioning: `Collaborative interface design tool for teams; browser-first, real-time multiplayer`  
- Product pricing model: `Freemium; paid tiers by editor count and advanced features`  
- Product URL: `https://www.figma.com/design/`  
- Competitor: **Canva** (from dropdown)  
- Competitor URL: `https://www.canva.com/features/`  
- Goal: `Compare feature set and positioning for design tools. Identify where Figma leads (e.g. collaboration, dev handoff) and where Canva leads (e.g. templates, ease of use) so we can sharpen messaging and roadmap priorities.`

---

## Optional: Changelog comparison

To also compare “what’s new”:

- Create a **second** product matchup (e.g. “Figma vs Canva – Changelog”) with the same product/competitor but:
  - **Competitor URL:** Canva’s release or changelog page (e.g. `https://www.canva.com/learn/all-the-features-on-canva/` or their blog – use whatever URL they use for updates).
- When running the scan, choose **Changelog** as the channel if the UI allows selecting channel; otherwise the scan will use the default (Product).

Or add a **changelog page** for Canva in Competitor Radar and run a separate scan there with Changelog selected.
