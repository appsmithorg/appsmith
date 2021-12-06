import React, { useState, useCallback, useContext, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import "@github/g-emoji-element";
import Dialog from "components/ads/DialogComponent";
import UpdatesButton from "./UpdatesButton";
import { AppState } from "reducers";
import { LayersContext } from "constants/Layers";
import ReleasesAPI from "api/ReleasesAPI";
import { resetReleasesCount } from "actions/releasesActions";
import ReleaseComponent, { Release } from "./ReleaseComponent";
import ScrollIndicator from "components/ads/ScrollIndicator";
import Button, { Category, Size } from "components/ads/Button";

const StyledDialog = styled(Dialog)`
  .bp3-dialog-body {
    overflow: hidden !important;
  }
`;

const Container = styled.div`
  width: 100%;
  height: 410px;
  overflow-y: auto;
  overflow-x: hidden;
  &&::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.modal.scrollbar};
  }
  &::-webkit-scrollbar {
    width: 4px;
  }
`;
const Footer = styled.div`
  display: flex;
  justify-content: end;
  margin-top: 30px;
  a:first-child {
    margin-right: ${(props) => props.theme.spaces[5]}px;
  }
`;

type ProductUpdatesModalProps = {
  isOpen?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
};

function ProductUpdatesModal(props: ProductUpdatesModalProps) {
  const { newReleasesCount, releaseItems } = useSelector(
    (state: AppState) => state.ui.releases,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const onOpening = useCallback(async () => {
    setIsOpen(true);
    dispatch(resetReleasesCount());
    await ReleasesAPI.markAsRead();
  }, []);

  const onClose = useCallback(() => {
    props.onClose && props.onClose();
    setIsOpen(false);
  }, []);

  const Layers = useContext(LayersContext);
  const [isOpen, setIsOpen] = useState(!!props.isOpen);

  return Array.isArray(releaseItems) && releaseItems.length > 0 ? (
    <StyledDialog
      canEscapeKeyClose
      canOutsideClickClose
      headerIcon={{
        name: "news-paper",
        bgColor: "transparent",
      }}
      isOpen={isOpen}
      maxHeight={"578px"}
      onClose={onClose}
      onOpening={onOpening}
      title="Product Updates"
      trigger={
        props.hideTrigger ? null : (
          <UpdatesButton newReleasesCount={newReleasesCount} />
        )
      }
      triggerZIndex={Layers.productUpdates}
      width={"580px"}
    >
      <Container ref={containerRef}>
        {releaseItems.map((release: Release, index: number) => (
          <ReleaseComponent key={index} release={release} />
        ))}
      </Container>
      <Footer>
        <Button
          category={Category.tertiary}
          data-cy="t--product-updates-close-btn"
          onClick={onClose}
          size={Size.large}
          text="CANCEL"
        />
        <Button
          category={Category.primary}
          data-cy="t--product-updates-ok-btn"
          onClick={onClose}
          size={Size.large}
          text="OK, THANKS"
        />
      </Footer>
      <ScrollIndicator containerRef={containerRef} />
    </StyledDialog>
  ) : null;
}

export default ProductUpdatesModal;
