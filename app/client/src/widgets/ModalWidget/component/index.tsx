import type { ReactNode, RefObject } from "react";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import type { AppState } from "@appsmith/reducers";
import { closeTableFilterPane } from "actions/widgetActions";
import { Colors } from "constants/Colors";
import { getCanvasClassName } from "utils/generators";
import { scrollCSS } from "widgets/WidgetUtils";

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

export type ModalComponentProps = {
  isOpen: boolean;
  onClose: (e: any) => void;
  onModalClose?: () => void;
  children: ReactNode;
  className?: string;
  canEscapeKeyClose: boolean;
  scrollContents: boolean;
  widgetId: string;
  background?: string;
  borderRadius?: string;
};

/* eslint-disable react/display-name */
export default function ModalComponent(props: ModalComponentProps) {
  const modalContentRef: RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);

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
        {props.children}
      </Content>
    </Wrapper>
  );
}
