import * as Sentry from "@sentry/react";
import React, { useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { getReadableSnapShotDetails } from "selectors/autoLayoutSelectors";
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
} from "design-system";

const Title = styled.h4`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-bold);
  font-size: var(--ads-v2-font-size-5);
`;

const SubText = styled.p`
  color: var(--ads-v2-color-fg-emphasis);
  font-weight: var(--ads-v2-font-weight-normal);
  font-size: var(--ads-v2-font-size-4);
`;

const ModalTitle = styled.h1`
  color: var(--ads-v2-color-fg-emphasis-plus);
  font-weight: var(--ads-v2-font-weight-bold);
  font-size: var(--ads-v2-font-size-10);
`;

export function SnapShotBannerCTA() {
  const [showModal, setShowModal] = useState(false);

  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );

  const readableSnapShotDetails = useSelector(getReadableSnapShotDetails);

  const formProps = useSnapShotForm();

  const dispatch = useDispatch();

  const onOpenOrClose = (
    isOpen: boolean,
    conversionState?: CONVERSION_STATES,
  ) => {
    if (isOpen && conversionState) {
      dispatch(setConversionStart(conversionState));
      setShowModal(true);
    } else {
      dispatch(setConversionStop());
      setShowModal(false);
    }
  };

  const modalHeader =
    conversionState === CONVERSION_STATES.SNAPSHOT_START
      ? createMessage(USE_SNAPSHOT_HEADER)
      : createMessage(DISCARD_SNAPSHOT_HEADER);

  return (
    <>
      <Callout
        kind="warning"
        links={[
          {
            children: createMessage(USE_SNAPSHOT_CTA),
            onClick: (e) => {
              e.preventDefault();
              onOpenOrClose(true, CONVERSION_STATES.SNAPSHOT_START);
            },
          },
          {
            children: createMessage(DISCARD_SNAPSHOT_CTA),
            onClick: (e) => {
              e.preventDefault();
              onOpenOrClose(true, CONVERSION_STATES.DISCARD_SNAPSHOT);
            },
          },
        ]}
      >
        <div className="flex flex-col">
          <Title>
            {readableSnapShotDetails
              ? createMessage(
                  SNAPSHOT_TIME_TILL_EXPIRATION_MESSAGE,
                  readableSnapShotDetails.timeTillExpiration,
                )
              : ""}
          </Title>
          <SubText>{createMessage(SNAPSHOT_BANNER_MESSAGE)}</SubText>
        </div>
      </Callout>
      <Modal open={showModal}>
        <ModalContent>
          <ModalHeader onClose={() => onOpenOrClose(false)}>
            <ModalTitle>{modalHeader}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <ConversionForm {...formProps} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

SnapShotBannerCTA.displayName = "SnapShotBannerCTA";

export default Sentry.withProfiler(SnapShotBannerCTA);
