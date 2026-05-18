import { describe, expect, it } from "vitest";
import { buildFixedCostOccurrence, getRecurringEndMonth } from "./fixedCostRecurrences";

describe("fixed cost recurrences", () => {
  it("calculates end month from a finite duration", () => {
    expect(getRecurringEndMonth("2026-05-01", 6)).toBe("2026-10-01");
  });

  it("returns null end month for indefinite duration", () => {
    expect(getRecurringEndMonth("2026-05-01", null)).toBeNull();
  });

  it("builds monthly occurrence with due status", () => {
    const occurrence = buildFixedCostOccurrence({
      recurring: {
        id: "rec-1",
        organization_id: "org-1",
        name: "Pro labore",
        description: "Douglas",
        category: "Pessoas",
        amount: 1780,
        due_date_day: 10,
        start_date: "2026-05-01",
        end_date: null,
        status: "active",
        active: true,
        duration_months: null,
        created_at: "2026-05-01",
      },
      selectedMonth: new Date("2026-05-15T12:00:00"),
      today: new Date("2026-05-13T12:00:00"),
    });

    expect(occurrence?.month).toBe("2026-05-01");
    expect(occurrence?.due_date).toBe("2026-05-10");
    expect(occurrence?.status).toBe("overdue");
  });

  it("keeps payments due today as pending", () => {
    const occurrence = buildFixedCostOccurrence({
      recurring: {
        id: "rec-1",
        organization_id: "org-1",
        name: "Pro labore",
        description: null,
        category: "Pessoas",
        amount: 1780,
        due_date_day: 13,
        start_date: "2026-05-01",
        end_date: null,
        status: "active",
        active: true,
        duration_months: null,
        created_at: "2026-05-01",
      },
      selectedMonth: new Date("2026-05-15T12:00:00"),
      today: new Date("2026-05-13T12:00:00"),
    });

    expect(occurrence?.status).toBe("pending");
  });
});
