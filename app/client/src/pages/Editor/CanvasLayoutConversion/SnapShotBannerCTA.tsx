import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { useSnapShotForm } from "./hooks/useSnapShotForm";
import { ConversionForm } from "./ConversionForm";
import {
  createMessage,
  DISCARD_SNAPSHOT_CTA,
  DISCARD_SNAPSHOT_HEADER,
  USE_SNAPSHOT_CTA,
  USE_SNAPSHOT_HEADER,
  SNAPSHOT_BANNER_MESSAGE,
  SNAPSHOT_TIME_TILL_EXPIRATION_MESSAGE,
} from "ee/constants/messages";
import {
  setConversionStart,
  setConversionStop,
} from "actions/autoLayoutActions";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Callout,
  Text,
} from "@appsmith/ads";
import { getReadableSnapShotDetails } from "../../../layoutSystems/autolayout/utils/AutoLayoutUtils";
import { getSnapshotUpdatedTime } from "selectors/autoLayoutSelectors";
import styled from "styled-components";

const BannerWrapper = styled.div`
  z-index: calc(var(--on-canvas-ui-z-index) + 1);
`;

export function SnapShotBannerCTA() {
  const [showModal, setShowModal] = useState(false);

  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );

  const hideCloseButton =
    conversionState === CONVERSION_STATES.COMPLETED_SUCCESS ||
    conversionState === CONVERSION_STATES.RESTORING_SNAPSHOT_SPINNER;

  const lastUpdatedTime = useSelector(getSnapshotUpdatedTime);
  const readableSnapShotDetails = getReadableSnapShotDetails(lastUpdatedTime);

  const formProps = useSnapShotForm();

  const dispatch = useDispatch();

  const modalHeader =
    conversionState === CONVERSION_STATES.DISCARD_SNAPSHOT
      ? createMessage(DISCARD_SNAPSHOT_HEADER)
      : createMessage(USE_SNAPSHOT_HEADER);

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      dispatch(setConversionStop());
    }, 0);
  };

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeModal();
    }
  };

  const openModal = (conversionState: CONVERSION_STATES) => {
    dispatch(setConversionStart(conversionState));
    setShowModal(true);
  };

  return (
    <BannerWrapper className="absolute top-0 w-full">
      <Callout
        kind="warning"
        links={[
          {
            children: createMessage(USE_SNAPSHOT_CTA),
            onClick: () => {
              openModal(CONVERSION_STATES.SNAPSHOT_START);
            },
          },
          {
            children: createMessage(DISCARD_SNAPSHOT_CTA),
            onClick: () => {
              openModal(CONVERSION_STATES.DISCARD_SNAPSHOT);
            },
          },
        ]}
      >
        <div className="flex flex-col">
          <Text kind="heading-s" renderAs="h4">
            {readableSnapShotDetails
              ? createMessage(
                  SNAPSHOT_TIME_TILL_EXPIRATION_MESSAGE,
                  readableSnapShotDetails.timeTillExpiration,
                )
              : ""}
          </Text>
          <Text kind="body-m" renderAs="p">
            {createMessage(SNAPSHOT_BANNER_MESSAGE)}
          </Text>
        </div>
      </Callout>
      <Modal onOpenChange={onOpenChange} open={showModal}>
        <ModalContent
          // Don't close Modal on escape key press
          onEscapeKeyDown={(e) => e.preventDefault()}
          // Don't close Modal when pressed outside
          onInteractOutside={(e) => e.preventDefault()}
          style={{ width: "640px" }}
        >
          <ModalHeader isCloseButtonVisible={!hideCloseButton}>
            {modalHeader}
          </ModalHeader>
          <ModalBody>
            <ConversionForm closeModal={closeModal} {...formProps} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </BannerWrapper>
  );
}

SnapShotBannerCTA.displayName = "SnapShotBannerCTA";

export default SnapShotBannerCTA;
