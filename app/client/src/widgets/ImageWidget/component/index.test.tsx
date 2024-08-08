import store from "store";
import React from "react";
import { Provider } from "react-redux";
import type { ImageComponentProps } from "./";
import ImageComponent from "./";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { urlToBase64 } from "../helper";

let container: HTMLDivElement | null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container as Node);
  container = null;
});

const mockData = "base64data";

jest.mock("../helper.ts", () => ({
  ...jest.requireActual("../helper.ts"),
  urlToBase64: jest.fn(async (url) => {
    if (!url) return Promise.resolve("");
    return Promise.resolve(`data:image/jpeg;base64,${mockData}`);
  }),
}));

describe("<ImageComponent />", () => {
  const imageUrl = "https://assets.appsmith.com/widgets/default.png";
  const defaultImageProps: ImageComponentProps = {
    imageUrl: imageUrl,
    enableDownload: true,
    defaultImageUrl: imageUrl,
    isLoading: false,
    maxZoomLevel: 0,
    objectFit: "",
    disableDrag: () => {},
    borderRadius: "",
    widgetId: "",
  };

  it("1. renders the image", async () => {
    const { container } = render(
      <Provider store={store}>
        <ImageComponent {...defaultImageProps} />
      </Provider>,
    );
    const imageContainer = container.querySelector("img");
    expect(imageContainer).not.toBeNull();
    expect(imageContainer?.getAttribute("src")).toBe(imageUrl);
  });

  it("2. renders the download button on hover", async () => {
    const { container, getByTestId } = render(
      <Provider store={store}>
        <ImageComponent {...defaultImageProps} />
      </Provider>,
    );
    const imageContainer = container.querySelector("img");
    expect(imageContainer).not.toBeNull();
    expect(imageContainer?.getAttribute("src")).toBe(imageUrl);
    fireEvent.mouseEnter(imageContainer as Element);
    expect(getByTestId("t--image-download")).not.toBeNull();
  });

  it("3. downloads the image on click", async () => {
    const { container, getByTestId } = render(
      <Provider store={store}>
        <ImageComponent {...defaultImageProps} />
      </Provider>,
    );

    const imageContainer = container.querySelector("img");
    expect(imageContainer).not.toBeNull();
    expect(imageContainer?.getAttribute("src")).toBe(imageUrl);
    fireEvent.mouseEnter(imageContainer as Element);
    const downloadButton = getByTestId(
      "t--image-download",
    ) as HTMLAnchorElement;
    expect(downloadButton).not.toBeNull();

    // Wait for the state to be updated
    await waitFor(() => expect(urlToBase64).toHaveBeenCalled());

    fireEvent.click(downloadButton);
    expect(downloadButton.href).toContain(`data:image/jpeg;base64,${mockData}`);
  });

  it("4. does not render download button if both image URL and default image URL is empty", async () => {
    const emptyUrlProps: ImageComponentProps = {
      ...defaultImageProps,
      imageUrl: "",
      defaultImageUrl: "",
    };

    const { container, queryByTestId } = render(
      <Provider store={store}>
        <ImageComponent {...emptyUrlProps} />
      </Provider>,
    );

    const imageContainer = container.querySelector("img");
    expect(imageContainer).not.toBeNull();
    expect(imageContainer?.getAttribute("src")).toBe("");

    fireEvent.mouseEnter(imageContainer as Element);

    await waitFor(() => expect(urlToBase64).toHaveBeenCalledWith(""));

    expect(queryByTestId("t--image-download")).toBeNull();
  });
});
