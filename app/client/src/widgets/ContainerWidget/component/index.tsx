import React, {
  ReactNode,
  useRef,
  useEffect,
  RefObject,
  useCallback,
} from "react";
import styled, { css } from "styled-components";
import tinycolor from "tinycolor2";
import fastdom from "fastdom";
import { invisible } from "constants/DefaultTheme";
import { Color } from "constants/Colors";
import { generateClassName, getCanvasClassName } from "utils/generators";
import WidgetStyleContainer, {
  WidgetStyleContainerProps,
} from "components/designSystems/appsmith/WidgetStyleContainer";
import { pick } from "lodash";
import { ComponentProps } from "widgets/BaseComponent";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

const scrollContents = css`
  overflow-y: auto;
`;

const StyledContainerComponent = styled.div<
  ContainerComponentProps & {
    ref: RefObject<HTMLDivElement>;
  }
>`
  height: 100%;
  width: 100%;
  background: ${(props) => props.backgroundColor};
  opacity: ${(props) => (props.resizeDisabled ? "0.8" : "1")};
  position: relative;
  ${(props) => (!props.isVisible ? invisible : "")};
  border-radius: ${({ borderRadius }) => borderRadius};
  backgound: ${({ backgroundColor }) => backgroundColor};

  ${(props) =>
    props.shouldScrollContents === true
      ? scrollContents
      : props.shouldScrollContents === false
      ? css`
          overflow: hidden;
        `
      : ""}

  &.hover-styles {
    z-index: 2;
    cursor: pointer;
    background: ${(props) => {
      return tinycolor(props.backgroundColor)
        .darken(5)
        .toString();
    }}
`;

function ContainerComponentWrapper(props: ContainerComponentProps) {
  const containerStyle = props.containerStyle || "card";
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.shouldScrollContents) {
      const supportsNativeSmoothScroll =
        "scrollBehavior" in document.documentElement.style;

      fastdom.mutate(() => {
        if (supportsNativeSmoothScroll) {
          containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
          }
        }
      });
    }
  }, [props.shouldScrollContents]);

  /**
   * This is for all the container widgets that have the onClickCapture method.
   * The mouse over event makes sure to add the class `hover-styles` so that a
   * darker shade of the background color takes effect to induce the hover effect.
   *
   * Why not use the :hover css selector?
   * For cases like List widget, it can have inner list widgets; so there can be
   * containers inside containers. When the inner container is hovered, the parent container's
   * :hover selector is also triggered making the outer and inner container both having this
   * hover effect.
   */
  const onMouseOver = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const widgetType = el.getAttribute("type");
      const widgetId = el.dataset.widgetid;
      const isMainContainer = widgetId === "0";

      if (
        (widgetType === "CONTAINER_WIDGET" && props.onClickCapture) ||
        isMainContainer
      ) {
        const elementsHovered = document.getElementsByClassName(
          "hover-styles",
        ) as HTMLCollectionOf<HTMLDivElement>;

        fastdom.mutate(() => {
          for (const elHovered of elementsHovered) {
            elHovered.classList.remove("hover-styles");
          }

          if (!isMainContainer) {
            el.classList.add("hover-styles");
          }
        });
      }
    },
    [props.onClickCapture],
  );

  return (
    <StyledContainerComponent
      {...props}
      // Before you remove: generateClassName is used for bounding the resizables within this canvas
      // getCanvasClassName is used to add a scrollable parent.
      className={`${
        props.shouldScrollContents ? getCanvasClassName() : ""
      } ${generateClassName(props.widgetId)}`}
      containerStyle={containerStyle}
      data-widgetId={props.widgetId}
      onMouseOver={onMouseOver}
      ref={containerRef}
      tabIndex={props.shouldScrollContents ? undefined : 0}
    >
      {props.children}
    </StyledContainerComponent>
  );
}

function ContainerComponent(props: ContainerComponentProps) {
  return props.widgetId === MAIN_CONTAINER_WIDGET_ID ? (
    <ContainerComponentWrapper {...props} />
  ) : (
    <WidgetStyleContainer
      {...pick(props, [
        "widgetId",
        "containerStyle",
        "backgroundColor",
        "borderColor",
        "borderWidth",
        "borderRadius",
        "boxShadow",
        "selected",
      ])}
    >
      <ContainerComponentWrapper {...props} />
    </WidgetStyleContainer>
  );
}

export type ContainerStyle = "border" | "card" | "rounded-border" | "none";

export interface ContainerComponentProps
  extends ComponentProps,
    WidgetStyleContainerProps {
  children?: ReactNode;
  className?: string;
  backgroundColor?: Color;
  shouldScrollContents?: boolean;
  resizeDisabled?: boolean;
  selected?: boolean;
  focused?: boolean;
  minHeight?: number;
  onClickCapture?: () => void;
}

export default ContainerComponent;
