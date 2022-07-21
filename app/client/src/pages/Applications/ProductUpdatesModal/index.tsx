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
import { Colors } from "constants/Colors";
import { Icon } from "components/ads";

const StyledDialog = styled(Dialog)`
  .bp3-dialog-body {
    overflow: hidden !important;
  }
`;

const Container = styled.div`
  position: relative;
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

const WhiteOverlay = styled.div`
  position: absolute;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    0deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0) 100%
  );

  span {
    color: ${Colors.CRUSTA};
    cursor: pointer;
    display: flex;
    justify-content: space-between;

    svg {
      height: 16px;
      width: 16px;
      margin-top: 2px;
    }

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: end;
  margin-top: 24px;
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
  const [showFull, setShowFull] = useState(false);

  const onClose = useCallback(() => {
    props.onClose && props.onClose();
    setIsOpen(false);
    setShowFull(false);
  }, []);

  const showFullUpdates = useCallback(() => {
    const ele = document.getElementById("white-overlay-product-updates");
    if (ele) {
      const h = ele.offsetHeight;
      containerRef.current?.scrollTo({ behavior: "smooth", top: h - 100 });
    }
    setShowFull(true);
  }, []);

  const Layers = useContext(LayersContext);
  const [isOpen, setIsOpen] = useState(!!props.isOpen);

  return Array.isArray(releaseItems) && releaseItems.length > 0 ? (
    <StyledDialog
      canEscapeKeyClose
      canOutsideClickClose
      headerIcon={{
        name: "file-list-line",
        bgColor: Colors.GEYSER_LIGHT,
      }}
      isOpen={isOpen}
      maxHeight={"94vh"}
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
      <Container
        ref={containerRef}
        style={!showFull ? { overflow: "hidden" } : {}}
      >
        {!showFull && (
          <WhiteOverlay id="white-overlay-product-updates">
            <span onClick={showFullUpdates}>
              Show more
              <Icon name="down-arrow" />
            </span>
          </WhiteOverlay>
        )}
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
