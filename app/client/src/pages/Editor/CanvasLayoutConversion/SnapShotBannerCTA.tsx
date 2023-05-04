import * as Sentry from "@sentry/react";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
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
} from "@appsmith/constants/messages";
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
} from "design-system";
import { getReadableSnapShotDetails } from "../../../utils/autoLayout/AutoLayoutUtils";

export function SnapShotBannerCTA() {
  const [showModal, setShowModal] = useState(false);

  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );

  const isConversionCompleted =
    conversionState === CONVERSION_STATES.COMPLETED_SUCCESS;

  const readableSnapShotDetails = useSelector(getReadableSnapShotDetails);

  const formProps = useSnapShotForm();

  const dispatch = useDispatch();

  const modalHeader =
    conversionState === CONVERSION_STATES.DISCARD_SNAPSHOT
      ? createMessage(DISCARD_SNAPSHOT_HEADER)
      : createMessage(USE_SNAPSHOT_HEADER);

  const closeModal = () => {
    setShowModal(false);
    dispatch(setConversionStop());
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
    <>
      <Callout
        kind="warning"
        links={[
          {
            children: createMessage(USE_SNAPSHOT_CTA),
            onClick: (e) => {
              e.preventDefault();
              openModal(CONVERSION_STATES.SNAPSHOT_START);
            },
          },
          {
            children: createMessage(DISCARD_SNAPSHOT_CTA),
            onClick: (e) => {
              e.preventDefault();
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
        >
          <ModalHeader isCloseButtonVisible={!isConversionCompleted}>
            {modalHeader}
          </ModalHeader>
          <ModalBody>
            <ConversionForm closeModal={closeModal} {...formProps} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

SnapShotBannerCTA.displayName = "SnapShotBannerCTA";

export default Sentry.withProfiler(SnapShotBannerCTA);
