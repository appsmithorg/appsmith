import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { connect, useDispatch } from "react-redux";
import { AppState } from "reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Button, { Category, Size } from "components/ads/Button";
import Text, { TextType } from "components/ads/Text";
import { getCrudInfoModalData } from "selectors/crudInfoModalSelectors";
import { setCrudInfoModalData } from "actions/crudInfoModalActions";
import { Colors } from "constants/Colors";

import Dialog from "components/ads/DialogComponent";
import { GenerateCRUDSuccessInfoData } from "reducers/uiReducers/crudInfoModalReducer";
import {
  GEN_CRUD_INFO_DIALOG_SUBTITLE,
  GEN_CRUD_SUCCESS_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import { getTypographyByKey } from "constants/DefaultTheme";
import { getInfoImage, getInfoThumbnail } from "constants/ImagesURL";
import ProgressiveImage, {
  Container as ProgressiveImageContainer,
} from "components/ads/ProgressiveImage";
import SuccessTick from "pages/common/SuccessTick";

type Props = {
  crudInfoModalOpen: boolean;
  generateCRUDSuccessInfo: GenerateCRUDSuccessInfoData | null;
};

const Heading = styled.div`
  color: ${Colors.CODE_GRAY};
  display: flex;
  justify-content: center;
  ${(props) => getTypographyByKey(props, "h1")}
`;

const ActionButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 30px 0px 0px;
`;

export const StyledSeparator = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.modal.separator};
  opacity: 0.6;
  height: 1px;
`;

const ActionButton = styled(Button)`
  margin-right: 16px;
`;

const Content = styled.div`
  padding: 16px;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 700px;
  min-height: 500px;

  .info-subtitle {
    padding-top: 5px;
    text-align: center;
  }
`;

const ImageWrapper = styled.div`
  padding: 50px 10px 10px;
  display: flex;
  flex: 1;
  justify-content: center;
  & ${ProgressiveImageContainer} {
    width: 100%;
    height: 284px;
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

const STEP = {
  SHOW_SUCCESS_GIF: "show_success_gif",
  SHOW_INFO: "show_info",
};

const DELAY_TIME = 3000;

function InfoContent({
  onClose,
  successImageUrl,
  successMessage,
}: {
  onClose: () => void;
  successMessage: string;
  successImageUrl: string;
}) {
  return (
    <>
      <Content>
        <Text
          className="info-subtitle"
          dangerouslySetInnerHTML={{
            __html: successMessage,
          }}
          type={TextType.P1}
        />
        <ImageWrapper>
          <ProgressiveImage
            alt="template information"
            imageSource={successImageUrl}
            thumbnailSource={getInfoThumbnail()}
          />
        </ImageWrapper>
      </Content>

      <ActionButtonWrapper>
        <ActionButton
          category={Category.primary}
          onClick={() => {
            onClose();
          }}
          size={Size.medium}
          text="GOT IT"
        />
      </ActionButtonWrapper>
    </>
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
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      isOpen={crudInfoModalOpen}
      setModalClose={onClose}
    >
      <Wrapper>
        {step === STEP.SHOW_SUCCESS_GIF ? (
          <SuccessContentWrapper>
            <SuccessTick height="80px" width="80px" />
            <Heading> {createMessage(GEN_CRUD_SUCCESS_MESSAGE)}</Heading>
          </SuccessContentWrapper>
        ) : null}
        {step === STEP.SHOW_INFO ? (
          <InfoContent
            onClose={onClose}
            successImageUrl={successImageUrl}
            successMessage={successMessage}
          />
        ) : null}
      </Wrapper>
    </Dialog>
  );
}

const mapStateToProps = (state: AppState) => ({
  crudInfoModalOpen: getCrudInfoModalData(state).crudInfoModalOpen,
  generateCRUDSuccessInfo: getCrudInfoModalData(state).generateCRUDSuccessInfo,
});

export default connect(mapStateToProps)(GenCRUDSuccessModal);
