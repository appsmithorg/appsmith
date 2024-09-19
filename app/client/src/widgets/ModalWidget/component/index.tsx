import type { ReactNode, RefObject } from "react";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import type { AppState } from "ee/reducers";
import { closeTableFilterPane } from "actions/widgetActions";
import { Colors } from "constants/Colors";
import { getCanvasClassName } from "utils/generators";
import { scrollCSS } from "widgets/WidgetUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { RenderMode } from "constants/WidgetConstants";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { useModalWidth } from "./useModalWidth";
import type {
  Alignment,
  Positioning,
  Spacing,
} from "layoutSystems/common/utils/constants";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";

const Content = styled.div<{ $scroll: boolean }>`
  overflow-x: hidden;
  width: 100%;
  height: 100%;
  ${scrollCSS}
  ${(props) => (!props.$scroll ? `overflow: hidden;` : ``)}
`;

const Wrapper = styled.div<{
  $background?: string;
  $borderRadius?: string;
}>`
  overflow: hidden;
  width: 100%;
  height: 100%;
  background: ${({ $background }) => `${$background || Colors.WHITE}`};
  border-radius: ${({ $borderRadius }) => $borderRadius};
`;

export interface ModalComponentProps {
  isOpen: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: (e: any) => void;
  onModalClose?: () => void;
  modalChildrenProps: WidgetProps[];
  className?: string;
  canEscapeKeyClose: boolean;
  scrollContents: boolean;
  widgetId: string;
  background?: string;
  borderRadius?: string;
  height: number;
  width: number;
  renderMode: RenderMode;
  shouldScrollContents: boolean;
  positioning?: Positioning;
  spacing?: Spacing;
  alignment?: Alignment;
}

/* eslint-disable react/display-name */
export default function ModalComponent(props: ModalComponentProps) {
  const modalContentRef: RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);
  const getModalWidth = useModalWidth();
  const modalWidth = getModalWidth(props.width);
  const dispatch = useDispatch();
  const isTableFilterPaneVisible = useSelector(
    (state: AppState) => state.ui.tableFilterPane.isVisible,
  );

  useEffect(() => {
    return () => {
      // handle modal close events when this component unmounts
      // will be called in all cases :-
      //  escape key press, click out side, close click from other btn widget
      if (props.onModalClose) props.onModalClose();
    };
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (props.canEscapeKeyClose) props.onClose(e);
    }
  };

  useEffect(() => {
    if (!props.scrollContents) {
      modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [props.scrollContents]);

  useEffect(() => {
    if (props.isOpen && isTableFilterPaneVisible) {
      dispatch(closeTableFilterPane());
    }
  }, [props.isOpen]);
  const renderChildWidget = (childWidgetData: WidgetProps): ReactNode => {
    const childData = { ...childWidgetData };

    childData.parentId = props.widgetId;

    childData.canExtend = props.shouldScrollContents;

    childData.containerStyle = "none";
    childData.minHeight = props.height;
    childData.rightColumn = modalWidth + WIDGET_PADDING * 2;

    childData.positioning = props.positioning;
    childData.alignment = props.alignment;
    childData.spacing = props.spacing;

    return renderAppsmithCanvas(childData as WidgetProps);
  };
  const getChildren = (): ReactNode => {
    if (
      props.height &&
      props.width &&
      props.modalChildrenProps &&
      props.modalChildrenProps.length > 0
    ) {
      const children = props.modalChildrenProps.filter(Boolean);

      return children.length > 0 && children.map(renderChildWidget);
    }
  };
  const children = getChildren();

  return (
    <Wrapper
      $background={props.background}
      $borderRadius={props.borderRadius}
      data-testid="modal-wrapper"
    >
      <Content
        $scroll={!!props.scrollContents}
        className={`${getCanvasClassName()} ${props.className} scroll-parent`}
        id={props.widgetId}
        ref={modalContentRef}
        tabIndex={0}
      >
        {children}
      </Content>
    </Wrapper>
  );
}
