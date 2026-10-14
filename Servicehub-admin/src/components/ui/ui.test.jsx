import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { Pagination } from "./Pagination";
import { StatusBadge } from "./StatusBadge";

describe("Pagination", () => {
  it("shows the visible range and moves between pages", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageSize={12} total={55} totalPages={5} onPageChange={onPageChange} label="bookings" />);

    expect(screen.getByText("13–24 of 55 bookings")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Prev" }));
    expect(onPageChange.mock.calls).toEqual([[3], [1]]);
  });

  it("disables the edges", () => {
    render(<Pagination page={5} pageSize={12} total={55} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByText("49–55 of 55 results")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Prev" })).toBeEnabled();
  });

  it("renders nothing when everything fits on one page", () => {
    const { container } = render(
      <Pagination page={1} pageSize={12} total={7} totalPages={1} onPageChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ConfirmDialog", () => {
  it("is an accessible modal that focuses its first field", () => {
    render(
      <ConfirmDialog open onClose={() => {}} title="Cancel booking" description="This can't be undone." onSubmit={() => {}}>
        <input aria-label="Reason" />
      </ConfirmDialog>
    );

    const dialog = screen.getByRole("dialog", { name: "Cancel booking" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("This can't be undone.");
    expect(screen.getByLabelText("Reason")).toHaveFocus();
  });

  it("closes on Escape without letting the key reach a drawer underneath", () => {
    const onClose = vi.fn();
    const onDrawerKeyDown = vi.fn();
    render(
      <div onKeyDown={onDrawerKeyDown}>
        <ConfirmDialog open onClose={onClose} title="Reject refund">
          <p>Body</p>
        </ConfirmDialog>
      </div>
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDrawerKeyDown).not.toHaveBeenCalled();
  });

  it("submits with Enter when it wraps a form", async () => {
    const onSubmit = vi.fn();
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        title="Rename"
        onSubmit={onSubmit}
        footer={<button type="submit">Save</button>}
      >
        <input aria-label="Name" />
      </ConfirmDialog>
    );

    await userEvent.type(screen.getByLabelText("Name"), "New name{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders nothing while closed", () => {
    render(<ConfirmDialog open={false} onClose={() => {}} title="Hidden" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("shows the status as a label", () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText(/in_progress/i)).toBeInTheDocument();
  });
});
