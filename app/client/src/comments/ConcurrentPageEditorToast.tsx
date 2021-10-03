import { ToastComponent } from "components/ads/Toast";
import styled from "styled-components";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isConcurrentPageEditorToastVisible } from "selectors/appCollabSelectors";
import {
  hideConcurrentEditorWarningToast,
  getIsConcurrentEditorWarningToastHidden,
} from "utils/storage";
import { getCurrentPageName } from "selectors/editorSelectors";

const Container = styled.div<{ visible?: boolean }>`
  position: fixed;
  top: 37px;
  transition: right 0.3s linear;
  right: ${(props) =>
    props.visible ? "1em" : "-300px"}; /* to move away from the viewport */

  & {
    .some-text {
      width: 100%;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      white-space: pre;
    }
  }
`;

const ActionElement = styled.span`
  cursor: pointer;
  display: inline-block;
  width: 100%;
  text-align: right;
`;

const getMessage = (currentPageName = "") => {
  const truncatedPageName =
    currentPageName.length > 9
      ? `${currentPageName.slice(0, 9)}...`
      : currentPageName;
  const msg = `Your changes may get overwritten on ${truncatedPageName}
(Realtime Editing is coming soon)
`;
  return msg;
};

export default function ConcurrentPageEditorToast() {
  const [isForceHidden, setIsForceHidden] = useState(true);
  const isVisible = useSelector(isConcurrentPageEditorToastVisible);
  const currentPageName = useSelector(getCurrentPageName);

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
          contentClassName="some-text "
          hideActionElementSpace
          text={getMessage(currentPageName)}
          width={"327px"}
        />
      )}
    </Container>
  );
}
