import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import styled from "styled-components";
import "@github/g-emoji-element";
import type { AppState } from "ee/reducers";
import ReleasesAPI from "api/ReleasesAPI";
import { resetReleasesCount } from "actions/releasesActions";
import type { Release } from "./ReleaseComponent";
import ReleaseComponent from "./ReleaseComponent";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@appsmith/ads";
import { isAirgapped } from "ee/utils/airgapHelpers";

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 410px;
`;

interface ProductUpdatesModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  hideTrigger?: boolean;
}

function ProductUpdatesModal(props: ProductUpdatesModalProps) {
  const { releaseItems } = useSelector((state: AppState) => state.ui.releases);
  const isAirgappedInstance = isAirgapped();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(!!props.isOpen);

  useEffect(() => {
    if (
      props.hideTrigger &&
      releaseItems.length === 0 &&
      !isAirgappedInstance
    ) {
      dispatch({
        type: ReduxActionTypes.FETCH_RELEASES,
      });
    }
  }, [isAirgappedInstance]);

  useEffect(() => {
    if (!props.isOpen) return;
    setIsOpen(true);
    dispatch(resetReleasesCount());
    ReleasesAPI.markAsRead();
  }, [props.isOpen]);

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose && props.onClose();
      setIsOpen(false);
    }
  };

  return Array.isArray(releaseItems) && releaseItems.length > 0 ? (
    <Modal onOpenChange={handleOnOpenChange} open={isOpen}>
      <ModalContent style={{ width: "640px" }}>
        <ModalHeader>Product updates</ModalHeader>
        <ModalBody>
          <Container>
            {releaseItems.map((release: Release, index: number) => (
              <ReleaseComponent key={index} release={release} />
            ))}
          </Container>
        </ModalBody>
      </ModalContent>
    </Modal>
  ) : null;
}

export default ProductUpdatesModal;
