import React from "react";
import { render } from "@testing-library/react";
import Marker from "../component/Marker";

// Mock the google maps API
const mockAddListener = jest.fn().mockImplementation((event, callback) => {
  // Store the callback to simulate click events
  if (event === "click") {
    (
      mockAddListener as unknown as {
        clickCallback: (...args: unknown[]) => void;
      }
    ).clickCallback = callback;
  }

  return "listener-id"; // Return a mock listener ID
});

const mockRemoveListener = jest.fn();
const mockSetMap = jest.fn();
const mockSetIcon = jest.fn();
const mockSetPosition = jest.fn();
const mockSetTitle = jest.fn();

// Add type declaration for the global google object
declare global {
  interface Window {
    google: unknown;
  }
}

// Mock the google object
(global as unknown as { google: unknown }).google = {
  maps: {
    Marker: jest.fn().mockImplementation(() => ({
      setMap: mockSetMap,
      setIcon: mockSetIcon,
      setPosition: mockSetPosition,
      setTitle: mockSetTitle,
      addListener: mockAddListener,
    })),
    Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
    event: {
      clearListeners: jest.fn(),
      removeListener: mockRemoveListener,
    },
  },
};

describe("Map Widget - Marker Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger onClick callback only once per click", () => {
    const onClickMock = jest.fn();

    // Render the marker component with onClick handler
    render(
      <Marker
        onClick={onClickMock}
        position={{ lat: 37.7749, lng: -122.4194 }}
        title="Test Marker"
      />,
    );

    // Simulate a marker click by directly calling the stored callback
    (
      mockAddListener as unknown as {
        clickCallback: (...args: unknown[]) => void;
      }
    ).clickCallback();

    // Verify onClick was called exactly once
    expect(onClickMock).toHaveBeenCalledTimes(1);

    // Simulate another click
    (
      mockAddListener as unknown as {
        clickCallback: (...args: unknown[]) => void;
      }
    ).clickCallback();

    // Verify onClick was called exactly twice (once per click)
    expect(onClickMock).toHaveBeenCalledTimes(2);
  });

  it("should clear previous click listeners when onClick prop changes", () => {
    const { rerender } = render(
      <Marker
        onClick={jest.fn()}
        position={{ lat: 37.7749, lng: -122.4194 }}
        title="Test Marker"
      />,
    );

    // Verify clearListeners was called during initial render
    expect(google.maps.event.clearListeners).toHaveBeenCalledWith(
      expect.anything(),
      "click",
    );

    // Reset the mock to check if it's called again
    (google.maps.event.clearListeners as jest.Mock).mockClear();

    // Rerender with a different onClick handler
    rerender(
      <Marker
        onClick={jest.fn()}
        position={{ lat: 37.7749, lng: -122.4194 }}
        title="Test Marker"
      />,
    );

    // Verify clearListeners was called again when onClick changed
    expect(google.maps.event.clearListeners).toHaveBeenCalledWith(
      expect.anything(),
      "click",
    );
  });
});
