// Wave 0 harness sanity check (FE).
// Mục đích DUY NHẤT: chứng minh vitest + jsdom + testing-library chạy được.
// ĐÂY KHÔNG PHẢI regression coverage cho UI thật.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Hello() {
  return <h1>Expense Tracker Harness OK</h1>;
}

describe("vitest harness sanity", () => {
  it("does pure arithmetic", () => {
    expect(1 + 1).toBe(2);
  });

  it("renders a component into jsdom", () => {
    render(<Hello />);
    expect(screen.getByText("Expense Tracker Harness OK")).toBeInTheDocument();
  });
});
