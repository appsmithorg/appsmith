import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { Classes, Overlay } from "@blueprintjs/core";
import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import styled from "styled-components";
import { Layers } from "constants/Layers";
import { theme } from "constants/DefaultTheme";
import { useDispatch, useSelector } from "react-redux";
import { getAppViewHeaderHeight } from "selectors/appViewSelectors";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { useMaxModalWidth } from "widgets/ModalWidget/component/useModalWidth";
const Container = styled.div<{
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  zIndex?: number;
  maxWidth?: number;
  minSize?: number;
  isEditMode?: boolean;
  headerHeight?: number;
  smallHeaderHeight?: string;
}>`
  &&& {
    .${Classes.OVERLAY} {
      .${Classes.OVERLAY_BACKDROP} {
        z-index: ${(props) => props.zIndex || 2 - 1};
      }
      position: fixed;
      top: ${(props) =>
        `calc(${props.headerHeight}px + ${
          props.isEditMode ? props.smallHeaderHeight : "0px"
        })`};
      right: 0;
      bottom: 0;
      height: ${(props) =>
        `calc(100vh - (${props.headerHeight}px + ${
          props.isEditMode ? props.smallHeaderHeight : "0px"
        }))`};
      z-index: ${(props) => props.zIndex};
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      & .${Classes.OVERLAY_CONTENT} {
        max-width: ${(props) => {
          if (props.maxWidth) return `${props.maxWidth}px`;

          if (props.isEditMode)
            return `calc(95% - ${props.theme.sidebarWidth})`;

          return `95%`;
        }};
        max-height: ${(props) => (props.isEditMode ? "85%" : "95%")};
        width: ${(props) => (props.width ? `${props.width}px` : "auto")};
        height: ${(props) => (props.height ? `${props.height}px` : "auto")};
        min-height: ${(props) => `${props.minSize}px`};
        min-width: ${(props) => `${props.minSize}px`};
        top: ${(props) => props.top}px;
        left: ${(props) => props.left}px;
        bottom: ${(props) => props.bottom}px;
        right: ${(props) => props.right}px;
      }
    }
  }
`;

const ComponentContainer = styled.div<{
  modalPosition: string;
}>`
  > .${Classes.OVERLAY} {
    > .${Classes.OVERLAY_CONTENT} {
      position: ${(props) => props.modalPosition};
    }
  }
`;

const ComponentContainerWrapper = ({
  children,
  isEditMode,
}: {
  isEditMode: boolean;
  children: ReactNode;
}) => {
  const [modalPosition, setModalPosition] = useState<string>("fixed");
  useEffect(() => {
    setTimeout(() => {
      setModalPosition("unset");
    }, 100);
  }, []);
  if (isEditMode) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }
  return (
    <ComponentContainer modalPosition={modalPosition}>
      {children}
    </ComponentContainer>
  );
};

export function ModalOverlayLayer(props: BaseWidgetProps) {
  const headerHeight = useSelector(getAppViewHeaderHeight);
  const dispatch = useDispatch();
  const getModalVisibility = () => {
    if (props.selectedWidgetAncestry) {
      return (
        props.selectedWidgetAncestry.includes(props.widgetId) ||
        !!props.isVisible
      );
    }
    return !!props.isVisible;
  };
  const isOpen = getModalVisibility();
  const closeModal = (e: any) => {
    dispatch({
      type: ReduxActionTypes.CLOSE_MODAL,
      payload: {
        modalName: props.widgetName,
      },
    });
    dispatch(selectWidgetInitAction(SelectionRequestType.Empty));
    e.stopPropagation();
    e.preventDefault();
  };

  const maxModalWidth = useMaxModalWidth();

  return (
    <ComponentContainerWrapper isEditMode={props.isEditMode}>
      <Overlay
        autoFocus={false}
        canEscapeKeyClose={false}
        canOutsideClickClose={false}
        enforceFocus={false}
        hasBackdrop={false}
        isOpen={isOpen}
        onClose={closeModal}
        usePortal={false}
      >
        <Container
          bottom={props.bottom}
          headerHeight={headerHeight}
          height={props.height}
          isEditMode={props.isEditMode}
          left={props.left}
          maxWidth={maxModalWidth}
          minSize={props.minSize}
          right={props.bottom}
          smallHeaderHeight={theme.smallHeaderHeight}
          top={props.top}
          width={props.width}
          zIndex={
            props.zIndex !== undefined ? props.zIndex : Layers.modalWidget
          }
        >
          <Overlay
            autoFocus={false}
            canEscapeKeyClose={props.canEscapeKeyClose}
            canOutsideClickClose={props.canOutsideClickClose}
            className={props.overlayClassName}
            enforceFocus={false}
            hasBackdrop
            isOpen={isOpen}
            onClose={closeModal}
            usePortal={false}
          >
            {props.children}
          </Overlay>
        </Container>
      </Overlay>
    </ComponentContainerWrapper>
  );
}
