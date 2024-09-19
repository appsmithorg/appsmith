import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import BottomView from "./BottomView";
import { ViewHideBehaviour } from "../Interfaces/View";
import { noop } from "lodash";
import "@testing-library/jest-dom";
import "jest-styled-components";

describe("BottomView", () => {
  describe("ViewHideBehaviour.COLLAPSE", () => {
    // HIDDEN = FALSE
    it("it is visible when hidden = false", () => {
      const { getByText } = render(
        <BottomView
          behaviour={ViewHideBehaviour.COLLAPSE}
          height={300}
          hidden={false}
          onHideClick={noop}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      expect(getByText("Hey test")).toBeTruthy();
    });
    it("it can be toggled when hidden = false", () => {
      const onViewHideToggle = jest.fn();
      const { getByRole } = render(
        <BottomView
          behaviour={ViewHideBehaviour.COLLAPSE}
          height={300}
          hidden={false}
          onHideClick={onViewHideToggle}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      const viewHideToggle = getByRole("button");

      act(() => {
        fireEvent.click(viewHideToggle);
      });
      expect(onViewHideToggle).toBeCalled();
    });

    it("assert container height when hidden = false", () => {
      const { container } = render(
        <BottomView
          behaviour={ViewHideBehaviour.COLLAPSE}
          height={300}
          hidden={false}
          onHideClick={noop}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      expect(container.children[0]).toHaveAttribute("style", "height: 300px;");
    });

    // HIDDEN = TRUE
    it("it is visible when hidden = true", () => {
      const { getByText } = render(
        <BottomView
          behaviour={ViewHideBehaviour.COLLAPSE}
          height={300}
          hidden
          onHideClick={noop}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      expect(getByText("Hey test")).toBeTruthy();
    });

    it("it can be toggled when hidden = true", () => {
      const onViewHideToggle = jest.fn();
      const { getByRole } = render(
        <BottomView
          behaviour={ViewHideBehaviour.COLLAPSE}
          height={300}
          hidden
          onHideClick={onViewHideToggle}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      const viewHideToggle = getByRole("button");

      act(() => {
        fireEvent.click(viewHideToggle);
      });
      expect(onViewHideToggle).toBeCalled();
    });

    it("assert container height when hidden = true", () => {
      const { container } = render(
        <BottomView
          behaviour={ViewHideBehaviour.COLLAPSE}
          height={300}
          hidden
          onHideClick={noop}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      expect(container.children[0]).toHaveAttribute("style", "height: 38px;");
    });
  });

  describe("ViewHideBehaviour.CLOSE", () => {
    // HIDDEN = FALSE
    it("it is visible when hidden = false", () => {
      const { getByText } = render(
        <BottomView
          behaviour={ViewHideBehaviour.CLOSE}
          height={300}
          hidden={false}
          onHideClick={noop}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      expect(getByText("Hey test")).toBeTruthy();
    });
    it("it can be toggled when hidden = false", () => {
      const onViewHideToggle = jest.fn();
      const { getByRole } = render(
        <BottomView
          behaviour={ViewHideBehaviour.CLOSE}
          height={300}
          hidden={false}
          onHideClick={onViewHideToggle}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      const viewHideToggle = getByRole("button");

      act(() => {
        fireEvent.click(viewHideToggle);
      });
      expect(onViewHideToggle).toBeCalled();
    });

    it("assert container height when hidden = false", () => {
      const { container } = render(
        <BottomView
          behaviour={ViewHideBehaviour.CLOSE}
          height={300}
          hidden={false}
          onHideClick={noop}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      expect(container.children[0]).toHaveAttribute("style", "height: 300px;");
    });

    // HIDDEN = TRUE
    it("it is visible when hidden = true", () => {
      const { getByText } = render(
        <BottomView
          behaviour={ViewHideBehaviour.CLOSE}
          height={300}
          hidden
          onHideClick={noop}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      expect(getByText("Hey test")).toBeTruthy();
    });

    it("it can be toggled when hidden = true", () => {
      const onViewHideToggle = jest.fn();
      const { getByRole } = render(
        <BottomView
          behaviour={ViewHideBehaviour.CLOSE}
          height={300}
          hidden
          onHideClick={onViewHideToggle}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      const viewHideToggle = getByRole("button");

      act(() => {
        fireEvent.click(viewHideToggle);
      });
      expect(onViewHideToggle).toBeCalled();
    });

    it("assert container height when hidden = true", () => {
      const { container } = render(
        <BottomView
          behaviour={ViewHideBehaviour.CLOSE}
          height={300}
          hidden
          onHideClick={noop}
          setHeight={noop}
        >
          <div id="bottomview">Hey test</div>
        </BottomView>,
      );

      expect(container.children[0]).toHaveAttribute("style", "height: 0px;");
    });
  });
});
