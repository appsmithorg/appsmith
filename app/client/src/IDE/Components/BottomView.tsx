import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Resizer, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import { CodeEditorWithGutterStyles } from "pages/Editor/JSEditor/styledComponents";
import { ViewDisplayMode, ViewHideBehaviour } from "IDE/Interfaces/View";
import { Button } from "@appsmith/ads";
import classNames from "classnames";

const VIEW_MIN_HEIGHT = 38;

const Container = styled.div<{ displayMode: ViewDisplayMode }>`
  ${ResizerCSS};
  width: 100%;
  background-color: var(--ads-v2-color-bg);
  border-top: 1px solid var(--ads-v2-color-border);
  ${(props) => {
    switch (props.displayMode) {
      case ViewDisplayMode.OVERLAY:
        return `
          position: absolute;
          bottom: 0;
        `;
    }
  }}
`;

const ViewWrapper = styled.div`
  height: 100%;
  &&& {
    ul.ads-v2-tabs__list {
      margin: 0 var(--ads-v2-spaces-8);
      height: ${VIEW_MIN_HEIGHT}px;
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
      height: 100%;
    }
  }
`;

const MIN_HEIGHT = {
  [ViewHideBehaviour.COLLAPSE]: `${VIEW_MIN_HEIGHT}px`,
  [ViewHideBehaviour.CLOSE]: "0px",
};

interface Props {
  className?: string;
  behaviour: ViewHideBehaviour;
  displayMode?: ViewDisplayMode;
  height: number;
  setHeight: (height: number) => void;
  hidden: boolean;
  onHideClick: () => void;
  children: React.ReactNode;
}

const ViewHideButton = styled(Button)`
  &.view-hide-button {
    position: absolute;
    top: 3px;
    right: 0;
    padding: 9px 11px;
  }
`;

interface ViewHideProps {
  hideBehaviour: ViewHideBehaviour;
  isHidden: boolean;
  onToggle: () => void;
}

const ViewHide = (props: ViewHideProps) => {
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
      className="view-hide-button"
      data-testid="t--view-hide-button"
      isIconButton
      kind="tertiary"
      onClick={props.onToggle}
      size="md"
      startIcon={icon}
    />
  );
};

const BottomView = (props: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { className = "" } = props;

  // Handle the height of the view when toggling the hidden state
  useEffect(() => {
    const panel = panelRef.current;

    if (!panel) return;

    if (props.hidden) {
      panel.style.height = MIN_HEIGHT[props.behaviour];
    } else {
      panel.style.height = `${props.height}px`;
    }
  }, [props.hidden, props.behaviour]);

  return (
    <Container
      className={classNames("select-text", {
        [className]: true,
        "t--ide-bottom-view": !props.hidden,
      })}
      displayMode={props.displayMode || ViewDisplayMode.BLOCK}
      ref={panelRef}
    >
      {!props.hidden && (
        <Resizer
          initialHeight={props.height}
          minHeight={VIEW_MIN_HEIGHT + 50}
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
