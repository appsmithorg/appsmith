import { ToastComponent } from "components/ads/Toast";
import styled from "styled-components";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isConcurrentPageEditorToastVisible } from "selectors/commentsSelectors";
import {
  hideConcurrentEditorWarningToast,
  getIsConcurrentEditorWarningToastHidden,
} from "utils/storage";

const Container = styled.div<{ visible?: boolean }>`
  position: fixed;
  top: 37px;
  transition: right 0.3s linear;
  right: ${(props) => (props.visible ? "1em" : "-300px")};

  & {
    .some-text {
      width: 100%;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      display: -webkit-box;
    }
  }
`;

const ActionElement = styled.span`
  cursor: pointer;
  display: inline-block;
  width: 100%;
  text-align: right;
`;

export default function ConcurrentPageEditorToast() {
  // eslint-disable-next-line
  const [isForceHidden, setIsForceHidden] = useState(true);
  // eslint-disable-next-line
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

  // eslint-disable-next-line
  const showToast = false; // isVisible && !isForceHidden;

  const msg =
    "<name> is editing your page <name> is editing your page <name> is editing your page <name> is editing your page";

  return (
    <Container visible>
      <ToastComponent
        actionElement={
          <ActionElement onClick={hidePermanently}>Dismiss</ActionElement>
        }
        contentClassName="some-text "
        hideActionElementSpace
        text={msg}
      />
    </Container>
  );
}
