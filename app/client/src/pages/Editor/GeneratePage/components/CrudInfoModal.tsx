import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { connect, useDispatch } from "react-redux";
import type { AppState } from "ee/reducers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  Button,
  Text,
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
} from "@appsmith/ads";
import { getCrudInfoModalData } from "selectors/crudInfoModalSelectors";
import { setCrudInfoModalData } from "actions/crudInfoModalActions";

import type { GenerateCRUDSuccessInfoData } from "reducers/uiReducers/crudInfoModalReducer";
import {
  GEN_CRUD_INFO_DIALOG_SUBTITLE,
  GEN_CRUD_SUCCESS_MESSAGE,
  createMessage,
} from "ee/constants/messages";
import { getInfoImage, getInfoThumbnail } from "constants/ImagesURL";
import {
  ProgressiveImage,
  Container as ProgressiveImageContainer,
} from "@appsmith/ads-old";
import SuccessTick from "pages/common/SuccessTick";
import { getAssetUrl } from "ee/utils/airgapHelpers";

interface Props {
  crudInfoModalOpen: boolean;
  generateCRUDSuccessInfo: GenerateCRUDSuccessInfoData | null;
}

const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 700px;
  min-height: 400px;

  .info-subtitle {
    text-align: center;
  }
`;

const ImageWrapper = styled.div`
  padding: 40px 0px 10px;
  display: flex;
  flex: 1;
  justify-content: center;
  & ${ProgressiveImageContainer} {
    width: 100%;
    height: 284px;
    width: 526px;
  }
  .progressive-image--thumb,
  progressive-image--full {
    object-fit: contain;
  }

  .progressive-image--thumb {
    filter: blur(20px);
    opacity: 0.3;
    transition: visibility 0ms ease 100ms;
  }
`;

const SuccessContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const InfoContentHeadingText = styled.span`
  color: var(--ads-v2-color-fg);
`;
const SuccessText = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
`;
const STEP = {
  SHOW_SUCCESS_GIF: "show_success_gif",
  SHOW_INFO: "show_info",
};

const DELAY_TIME = 3000;

function InfoContent({
  successImageUrl,
  successMessage,
}: {
  successMessage: string;
  successImageUrl: string;
}) {
  return (
    <Content>
      {/* TODO: Replace this with ADS text */}
      <InfoContentHeadingText
        className="info-subtitle"
        dangerouslySetInnerHTML={{
          __html: successMessage,
        }}
      />
      <ImageWrapper>
        <ProgressiveImage
          alt="template information"
          imageSource={getAssetUrl(successImageUrl)}
          thumbnailSource={getInfoThumbnail()}
        />
      </ImageWrapper>
    </Content>
  );
}

function GenCRUDSuccessModal(props: Props) {
  const { crudInfoModalOpen, generateCRUDSuccessInfo } = props;

  const dispatch = useDispatch();
  const [step, setStep] = useState(STEP.SHOW_SUCCESS_GIF);

  const onClose = () => {
    AnalyticsUtil.logEvent("CLOSE_GEN_PAGE_INFO_MODAL");
    dispatch(setCrudInfoModalData({ open: false }));
  };

  const successMessage =
    (generateCRUDSuccessInfo && generateCRUDSuccessInfo.successMessage) ||
    createMessage(GEN_CRUD_INFO_DIALOG_SUBTITLE);

  const successImageUrl =
    (generateCRUDSuccessInfo && generateCRUDSuccessInfo.successImageUrl) ||
    getInfoImage();

  useEffect(() => {
    const timerId = setTimeout(() => {
      setStep(STEP.SHOW_INFO);
    }, DELAY_TIME);
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [setStep]);

  return (
    <Modal onOpenChange={onClose} open={crudInfoModalOpen}>
      <ModalContent style={{ width: "640px" }}>
        <ModalBody>
          <Wrapper>
            {step === STEP.SHOW_SUCCESS_GIF ? (
              <SuccessContentWrapper>
                <SuccessTick height="80px" width="80px" />
                <SuccessText kind="heading-m">
                  {" "}
                  {createMessage(GEN_CRUD_SUCCESS_MESSAGE)}
                </SuccessText>
              </SuccessContentWrapper>
            ) : null}
            {step === STEP.SHOW_INFO ? (
              <InfoContent
                successImageUrl={successImageUrl}
                successMessage={successMessage}
              />
            ) : null}
          </Wrapper>
        </ModalBody>
        <ModalFooter>
          <Button kind="primary" onClick={onClose} size={"md"}>
            Got it
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

const mapStateToProps = (state: AppState) => ({
  crudInfoModalOpen: getCrudInfoModalData(state).crudInfoModalOpen,
  generateCRUDSuccessInfo: getCrudInfoModalData(state).generateCRUDSuccessInfo,
});

export default connect(mapStateToProps)(GenCRUDSuccessModal);
