import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InstagramEmptyState } from "@/components/dashboard/instagram-empty-state";

describe("InstagramEmptyState", () => {
  it("renders CTA to configuracoes", () => {
    render(<InstagramEmptyState />);

    const link = screen.getByRole("link", { name: /conectar instagram/i });
    expect(link).toHaveAttribute("href", "/dashboard/configuracoes");
  });
});
