import type {
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
  RefObject,
} from "react";
import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import tinycolor from "tinycolor2";
import fastdom from "fastdom";
import { generateClassName, getCanvasClassName } from "utils/generators";
import type { WidgetStyleContainerProps } from "components/designSystems/appsmith/WidgetStyleContainer";
import WidgetStyleContainer from "components/designSystems/appsmith/WidgetStyleContainer";
import { scrollCSS } from "widgets/WidgetUtils";
import { useSelector } from "react-redux";
import { LayoutSystemTypes } from "layoutSystems/types";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { WidgetType } from "WidgetProvider/factory";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";

const StyledContainerComponent = styled.div<
  Omit<ContainerWrapperProps, "widgetId">
>`
  height: 100%;
  width: 100%;
  overflow: hidden;
  outline: none;
  ${(props) => (!!props.dropDisabled ? `position: relative;` : ``)}

  ${(props) =>
    props.shouldScrollContents && !props.$noScroll ? scrollCSS : ``}
  opacity: ${(props) => (props.resizeDisabled ? "0.8" : "1")};

  background: ${(props) => props.backgroundColor};
  &:hover {
    background-color: ${(props) => {
      return props.onClickCapture && props.backgroundColor
        ? tinycolor(props.backgroundColor).darken(5).toString()
        : props.backgroundColor;
    }};
    z-index: ${(props) => (props.onClickCapture ? "2" : "1")};
    cursor: ${(props) => (props.onClickCapture ? "pointer" : "inherit")};
  }
`;

interface ContainerWrapperProps {
  onClick?: MouseEventHandler<HTMLDivElement>;
  onClickCapture?: MouseEventHandler<HTMLDivElement>;
  resizeDisabled?: boolean;
  shouldScrollContents?: boolean;
  backgroundColor?: string;
  widgetId: string;
  type: WidgetType;
  dropDisabled?: boolean;
  $noScroll: boolean;
}

function ContainerComponentWrapper(
  props: PropsWithChildren<ContainerWrapperProps>,
) {
  const containerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const layoutSystemType = useSelector(getLayoutSystemType);

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
      // Before you remove: generateClassName is used for bounding the resizables within this canvas
      // getCanvasClassName is used to add a scrollable parent.
      $noScroll={props.$noScroll}
      backgroundColor={props.backgroundColor}
      className={`${
        props.shouldScrollContents ? getCanvasClassName() : ""
      } ${generateClassName(props.widgetId)} container-with-scrollbar ${
        layoutSystemType === LayoutSystemTypes.AUTO &&
        props.widgetId === MAIN_CONTAINER_WIDGET_ID
          ? "auto-layout"
          : ""
      }`}
      dropDisabled={props.dropDisabled}
      onClick={props.onClick}
      onClickCapture={props.onClickCapture}
      onMouseOver={onMouseOver}
      ref={containerRef}
      resizeDisabled={props.resizeDisabled}
      shouldScrollContents={!!props.shouldScrollContents}
      tabIndex={props.shouldScrollContents ? undefined : 0}
      type={props.type}
    >
      {props.children}
    </StyledContainerComponent>
  );
}

function ContainerComponent(props: ContainerComponentProps) {
  if (props.detachFromLayout) {
    return (
      <ContainerComponentWrapper
        $noScroll={!!props.noScroll}
        dropDisabled={props.dropDisabled}
        onClick={props.onClick}
        onClickCapture={props.onClickCapture}
        resizeDisabled={props.resizeDisabled}
        shouldScrollContents={
          props.shouldScrollContents &&
          props.layoutSystemType === LayoutSystemTypes.FIXED
        }
        type={props.type}
        widgetId={props.widgetId}
      >
        {props.children}
      </ContainerComponentWrapper>
    );
  }

  return (
    <WidgetStyleContainer
      backgroundColor={props.backgroundColor}
      borderColor={props.borderColor}
      borderRadius={props.borderRadius}
      borderWidth={props.borderWidth}
      boxShadow={props.boxShadow}
      className="style-container"
      containerStyle={props.containerStyle}
      selected={props.selected}
      widgetId={props.widgetId}
    >
      <ContainerComponentWrapper
        $noScroll={!!props.noScroll}
        backgroundColor={props.backgroundColor}
        dropDisabled={props.dropDisabled}
        onClick={props.onClick}
        onClickCapture={props.onClickCapture}
        resizeDisabled={props.resizeDisabled}
        shouldScrollContents={
          props.shouldScrollContents &&
          // Disable scrollbar on auto-layout canvas as it meddles with canvas drag and highlight position.
          (props.layoutSystemType === LayoutSystemTypes.FIXED ||
            // We need to allow scrollbars for list items as they don't have auto-height
            props.isListItemContainer)
        }
        type={props.type}
        widgetId={props.widgetId}
      >
        {props.children}
      </ContainerComponentWrapper>
    </WidgetStyleContainer>
  );
}

export type ContainerStyle = "border" | "card" | "rounded-border" | "none";

export interface ContainerComponentProps extends WidgetStyleContainerProps {
  children?: ReactNode;
  shouldScrollContents?: boolean;
  resizeDisabled?: boolean;
  selected?: boolean;
  focused?: boolean;
  detachFromLayout?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onClickCapture?: MouseEventHandler<HTMLDivElement>;
  backgroundColor?: string;
  type: WidgetType;
  noScroll?: boolean;
  minHeight?: number;
  useAutoLayout?: boolean;
  direction?: string;
  justifyContent?: string;
  alignItems?: string;
  dropDisabled?: boolean;
  layoutSystemType?: LayoutSystemTypes;
  isListItemContainer?: boolean;
}

export default ContainerComponent;
