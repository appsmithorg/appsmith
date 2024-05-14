import React, {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import Resizer, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import { ActionExecutionResizerHeight } from "pages/Editor/APIEditor/constants";
import { CodeEditorWithGutterStyles } from "pages/Editor/JSEditor/constants";
import { ViewHideBehaviour } from "../Interfaces/ViewHideBehaviour";
import { Button } from "design-system";

const VIEW_MIN_HEIGHT = "38px";

const Container = styled.div`
  ${ResizerCSS};
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: ${VIEW_MIN_HEIGHT};
  background-color: var(--ads-v2-color-bg);
  height: ${ActionExecutionResizerHeight}px;
  border-top: 1px solid var(--ads-v2-color-border);
`;

const ViewWrapper = styled.div`
  height: 100%;
  &&& {
    ul.ads-v2-tabs__list {
      margin: 0 ${(props) => props.theme.spaces[11]}px;
      height: ${VIEW_MIN_HEIGHT};
    }
  }

  & {
    .ads-v2-tabs__list {
      padding: var(--ads-v2-spaces-1) var(--ads-v2-spaces-7);
    }
  }

  & {
    .ads-v2-tabs__panel {
      ${CodeEditorWithGutterStyles};
      overflow-y: auto;
      height: calc(100% - ${VIEW_MIN_HEIGHT});
    }
  }
`;

const MIN_HEIGHT = {
  [ViewHideBehaviour.COLLAPSE]: VIEW_MIN_HEIGHT,
  [ViewHideBehaviour.CLOSE]: "0px",
};

interface Props {
  className?: string;
  behaviour: ViewHideBehaviour;
  height: number;
  setHeight: (height: number) => void;
  hidden: boolean;
  onHideClick: () => void;
  children: React.ReactNode;
  additionalContainerStyles?: CSSProperties;
}

const ViewHideButton = styled(Button)`
  &.view-hide-button {
    position: absolute;
    top: 3px;
    right: 0;
    padding: 9px 11px;
  }
`;

const ViewHide = (props: {
  hideBehaviour: ViewHideBehaviour;
  isHidden: boolean;
  onToggle: () => void;
}) => {
  const [icon, setIcon] = useState(() => {
    return props.hideBehaviour === ViewHideBehaviour.CLOSE
      ? "close-modal"
      : "arrow-down-s-line";
  });

  useEffect(() => {
    if (props.hideBehaviour === ViewHideBehaviour.COLLAPSE) {
      if (props.isHidden) {
        setIcon("arrow-up-s-line");
      } else {
        setIcon("arrow-down-s-line");
      }
    }
  }, [props.isHidden]);

  return (
    <ViewHideButton
      className="view-hide-button t--view-hide-button"
      isIconButton
      kind="tertiary"
      onClick={props.onToggle}
      size="md"
      startIcon={icon}
    />
  );
};

const BottomView = (props: Props) => {
  const panelRef: RefObject<HTMLDivElement> = useRef(null);

  // Handle the height of the tabs when toggling the hidden state
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (props.hidden) {
      panel.style.height = MIN_HEIGHT[props.behaviour];
    } else {
      panel.style.height = `${props.height}px`;
    }
  }, [props.hidden]);

  return (
    <Container
      className={`select-text ${props.className}`}
      ref={panelRef}
      style={props.additionalContainerStyles}
    >
      {!props.hidden && (
        <Resizer
          initialHeight={props.height}
          onResizeComplete={props.setHeight}
          panelRef={panelRef}
        />
      )}
      <ViewWrapper>
        {props.children}
        <ViewHide
          hideBehaviour={props.behaviour}
          isHidden={props.hidden}
          onToggle={props.onHideClick}
        />
      </ViewWrapper>
    </Container>
  );
};

export default BottomView;
