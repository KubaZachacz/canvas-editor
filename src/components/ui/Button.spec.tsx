import Button from "./Button";
import { render, screen } from "@testing-library/react";

describe("Button", () => {
  it("renders a button with the correct text", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Click me");
  });
});
