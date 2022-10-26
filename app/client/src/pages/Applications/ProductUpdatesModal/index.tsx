import React, {
  useState,
  useCallback,
  useContext,
  useRef,
  useEffect,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import "@github/g-emoji-element";
import UpdatesButton from "./UpdatesButton";
import { AppState } from "@appsmith/reducers";
import { LayersContext } from "constants/Layers";
import ReleasesAPI from "api/ReleasesAPI";
import { resetReleasesCount } from "actions/releasesActions";
import ReleaseComponent, { Release } from "./ReleaseComponent";
import { DialogComponent as Dialog, ScrollIndicator } from "design-system";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

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

  useEffect(() => {
    if (props.hideTrigger && releaseItems.length === 0) {
      dispatch({
        type: ReduxActionTypes.FETCH_RELEASES,
      });
    }
  }, []);

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
      <Container ref={containerRef}>
        {releaseItems.map((release: Release, index: number) => (
          <ReleaseComponent key={index} release={release} />
        ))}
      </Container>
      <ScrollIndicator containerRef={containerRef} />
    </StyledDialog>
  ) : null;
}

export default ProductUpdatesModal;
