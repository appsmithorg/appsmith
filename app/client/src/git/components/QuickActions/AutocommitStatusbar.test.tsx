import React from "react";
import { render, screen, act } from "@testing-library/react";
import AutocommitStatusbar from "./AutocommitStatusbar";
import "@testing-library/jest-dom";

// Mock timers using Jest
jest.useFakeTimers();

// Mock the Statusbar component from '@appsmith/ads-old'
jest.mock("@appsmith/ads-old", () => ({
  Statusbar: ({ percentage }: { percentage: number }) => (
    <div data-testid="statusbar">{percentage}%</div>
  ),
}));

describe("AutocommitStatusbar Component", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should render with initial percentage 0 when completed is false", () => {
    render(<AutocommitStatusbar completed={false} />);
    const statusbar = screen.getByTestId("statusbar");

    expect(statusbar).toBeInTheDocument();
    expect(statusbar).toHaveTextContent("0%");
  });

  it("should increment percentage over time when completed is false", () => {
    render(<AutocommitStatusbar completed={false} />);
    const statusbar = screen.getByTestId("statusbar");

    // Initial percentage
    expect(statusbar).toHaveTextContent("0%");

    // Advance timer by one interval
    act(() => {
      jest.advanceTimersByTime((4 * 1000) / 9);
    });
    expect(statusbar).toHaveTextContent("10%");

    // Advance timer by another interval
    act(() => {
      jest.advanceTimersByTime((4 * 1000) / 9);
    });
    expect(statusbar).toHaveTextContent("20%");

    // Continue until percentage reaches 90%
    act(() => {
      jest.advanceTimersByTime((4 * 1000 * 7) / 9);
    });
    expect(statusbar).toHaveTextContent("90%");
  });

  it("should not increment percentage beyond 90 when completed is false", () => {
    render(<AutocommitStatusbar completed={false} />);
    const statusbar = screen.getByTestId("statusbar");

    // Advance time beyond the total interval duration
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(statusbar).toHaveTextContent("90%");

    // Advance time further to ensure percentage doesn't exceed 90%
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(statusbar).toHaveTextContent("90%");
  });

  it("should set percentage to 100 when completed is true", () => {
    render(<AutocommitStatusbar completed />);
    const statusbar = screen.getByTestId("statusbar");

    expect(statusbar).toHaveTextContent("100%");
  });

  it("should call onHide after 1 second when completed is true", () => {
    const onHide = jest.fn();

    render(<AutocommitStatusbar completed onHide={onHide} />);
    expect(onHide).not.toHaveBeenCalled();

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("should clean up intervals and timeouts on unmount", () => {
    const onHide = jest.fn();

    render(<AutocommitStatusbar completed={false} onHide={onHide} />);

    // Start the interval
    act(() => {
      jest.advanceTimersByTime((4 * 1000) / 9);
    });

    // Unmount the component

    // Advance time to see if any timers are still running
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(onHide).not.toHaveBeenCalled();
  });

  it("should handle transition from false to true for completed prop", () => {
    const onHide = jest.fn();
    const { rerender } = render(
      <AutocommitStatusbar completed={false} onHide={onHide} />,
    );
    const statusbar = screen.getByTestId("statusbar");

    // Advance timer to increase percentage
    act(() => {
      jest.advanceTimersByTime((4 * 1000) / 9);
    });
    expect(statusbar).toHaveTextContent("10%");

    // Update the completed prop to true
    rerender(<AutocommitStatusbar completed onHide={onHide} />);
    expect(statusbar).toHaveTextContent("100%");

    // Ensure onHide is called after 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("should not reset percentage when completed changes from true to false", () => {
    const { rerender } = render(<AutocommitStatusbar completed />);
    const statusbar = screen.getByTestId("statusbar");

    expect(statusbar).toHaveTextContent("100%");

    // Change completed to false
    rerender(<AutocommitStatusbar completed={false} />);
    expect(statusbar).toHaveTextContent("100%");

    // Advance timer to check if percentage increments beyond 100%
    act(() => {
      jest.advanceTimersByTime((4 * 1000) / 9);
    });
    expect(statusbar).toHaveTextContent("100%");
  });
});
