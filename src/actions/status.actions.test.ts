import { getStatusSummaryAction } from "./status.actions";

describe("getStatusSummaryAction", () => {
  it("returns agents and at least one recent run", async () => {
    const result = await getStatusSummaryAction();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

