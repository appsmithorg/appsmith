import React from "react";
import "@testing-library/jest-dom";
import "jest-styled-components";
import renderer from "react-test-renderer";
import AutoResizeTextArea from "./AutoResizeTextArea";

describe("<AutoResizeTextArea />", () => {
  describe("when autoResize is true", () => {
    it("it should render a proxy textarea", async () => {
      const tree = renderer.create(<AutoResizeTextArea autoResize />);

      // eslint-disable-next-line testing-library/await-async-queries
      expect(tree.root.findAllByType("textarea").length).toBe(2);
    });
  });

  describe("when autoResize is false", () => {
    it("it should not render a proxy textarea if autoResize is false", async () => {
      const tree = renderer.create(<AutoResizeTextArea autoResize={false} />);

      // eslint-disable-next-line testing-library/await-async-queries
      expect(tree.root.findAllByType("textarea").length).toBe(1);
    });
  });
});
