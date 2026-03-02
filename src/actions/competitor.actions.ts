/** Server Actions for fetching and adding competitors (Competitor Radar). */

"use server";

import type { ActionResponse } from "@/types/actions.types";
import type { Competitor } from "@/components/features/competitor-radar/competitor-radar.types";

const initialMock: Competitor[] = [
  { id: "1", name: "Acme Corp", website: "https://acme.example.com", logoUrl: null, isActive: true },
  { id: "2", name: "Beta Inc", website: "https://beta.example.com", logoUrl: null, isActive: true },
  { id: "3", name: "Gamma LLC", website: "https://gamma.example.com", logoUrl: null, isActive: true },
];

let mockStore = [...initialMock];

/** Returns list of competitors for the authenticated company. Mock data for UI flow. */
export async function getCompetitorsAction(): Promise<ActionResponse<Competitor[]>> {
  return { success: true, data: [...mockStore] };
}

export interface AddCompetitorInput {
  name: string;
  url: string;
}

/** Adds one or more competitors. Returns the newly created competitors. Mock: in-memory store. */
export async function addCompetitorsAction(
  inputs: AddCompetitorInput[]
): Promise<ActionResponse<Competitor[]>> {
  const valid = inputs.filter((i) => i.name.trim() && i.url.trim());
  if (valid.length === 0) {
    return { success: false, error: "At least one competitor with name and URL is required." };
  }
  const normalized = valid.map((i) => {
    let website = i.url.trim();
    if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
    return {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: i.name.trim(),
      website,
      logoUrl: null as string | null,
      isActive: true,
    };
  });
  mockStore = [...mockStore, ...normalized];
  return { success: true, data: normalized };
}
