import { ToastComponent } from "components/ads/Toast";
import styled from "styled-components";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isConcurrentPageEditorToastVisible } from "selectors/appCollabSelectors";
import {
  hideConcurrentEditorWarningToast,
  getIsConcurrentEditorWarningToastHidden,
} from "utils/storage";
import { Layers } from "constants/Layers";
import { createGlobalStyle } from "styled-components";

const Container = styled.div<{ visible?: boolean }>`
  position: fixed;
  top: 50px;
  transition: right 0.3s linear;
  right: ${(props) =>
    props.visible ? "1em" : "-500px"}; /* to move away from the viewport */

  & {
    .concurrent-editing-warning-text {
      width: 100%;
      overflow: hidden;
    }
  }
  z-index: ${Layers.concurrentEditorWarning};
`;

const ActionElement = styled.span`
  cursor: pointer;
  display: inline-block;
  width: 100%;
  text-align: right;
  margin-top: ${(props) => props.theme.spaces[1]}px;
`;

// move existing toast below to make space for the warning toast
const ToastStyle = createGlobalStyle`
  .Toastify__toast-container--top-right {
    top: 9.5em !important;
  }
`;

const getMessage = () => {
  const msg = `Other users editing this page may overwrite your changes. Realtime editing is coming soon!`;
  return msg;
};

export default function ConcurrentPageEditorToast() {
  const [isForceHidden, setIsForceHidden] = useState(true);
  const isVisible = useSelector(isConcurrentPageEditorToastVisible);

  useEffect(() => {
    (async () => {
      const flag = await getIsConcurrentEditorWarningToastHidden();
      setIsForceHidden(!!flag);
    })();
  }, []);

  const hidePermanently = () => {
    hideConcurrentEditorWarningToast(); // save in persistent storage
    setIsForceHidden(true);
  };

  const showToast = isVisible && !isForceHidden;

  return (
    <Container visible={showToast}>
      {showToast && (
        <ToastComponent
          actionElement={
            <ActionElement onClick={hidePermanently}>Dismiss</ActionElement>
          }
          contentClassName="concurrent-editing-warning-text "
          hideActionElementSpace
          text={getMessage()}
          width={"327px"}
        />
      )}
      {showToast && <ToastStyle />}
    </Container>
  );
}
