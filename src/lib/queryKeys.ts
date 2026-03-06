/** TanStack Query key factories. */

export const competitorKeys = {
  all: ["competitors"] as const,
  listAndSummary: () => [...competitorKeys.all, "list-and-summary"] as const,
};

export const complianceKeys = {
  all: ["compliance"] as const,
  list: () => [...complianceKeys.all, "list"] as const,
};

export const productMatchupKeys = {
  all: ["product-matchups"] as const,
  list: () => [...productMatchupKeys.all, "list"] as const,
};

export const statusKeys = {
  all: ["status"] as const,
  summary: () => [...statusKeys.all, "summary"] as const,
};

export const flowsKeys = {
  all: ["flows"] as const,
  list: () => [...flowsKeys.all, "list"] as const,
};

export const insightsKeys = {
  all: ["insights"] as const,
  summary: () => [...insightsKeys.all, "summary"] as const,
};

export const informationKeys = {
  all: ["information"] as const,
  overview: () => [...informationKeys.all, "overview"] as const,
};
