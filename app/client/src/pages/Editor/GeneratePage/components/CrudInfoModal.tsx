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
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

import Dialog from "components/ads/DialogComponent";
import { GenerateCRUDSuccessInfoData } from "../../../../reducers/uiReducers/crudInfoModalReducer";
import {
  GEN_CRUD_INFO_DIALOG_SUBTITLE,
  GEN_CRUD_SUCCESS_MESSAGE,
  GEN_CRUD_SUCCESS_DESC,
  createMessage,
} from "constants/messages";
import { getTypographyByKey } from "constants/DefaultTheme";

type Props = {
  crudInfoModalOpen: boolean;
  generateCRUDSuccessInfo: GenerateCRUDSuccessInfoData | null;
};

const getSuccessGIF = () => `${ASSETS_CDN_URL}/crud/check_mark_verified.gif`;

const Heading = styled.div`
  color: ${Colors.CODE_GRAY};
  display: flex;
  justify-content: center;
  font-size: 20px;
  line-height: 24px;
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

const Desc = styled.p`
  ${(props) => getTypographyByKey(props, "p1")}
  color: ${Colors.DOVE_GRAY2};
  margin-top: 8px;
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

const InfoImage = styled.img`
  flex: 1;
  width: 340px;
`;

const ImageWrapper = styled.div`
  padding: 50px 10px 10px;
  display: flex;
  flex: 1;
  justify-content: center;
`;

const SuccessContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const SuccessImage = styled.img`
  margin: ${(props) => props.theme.spaces[6]}px;
`;

const STEP = {
  SHOW_SUCCESS_GIF: "show_success_gif",
  SHOW_INFO: "show_info",
};

const getInfoImage = (): string =>
  `${ASSETS_CDN_URL}/crud/working-flow-chart.png`;

const DELAY_TIME = 6000;

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
          <InfoImage alt="CRUD Info" src={successImageUrl} />
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
            <SuccessImage alt="Success" src={getSuccessGIF()} width="50px" />
            <Heading> {createMessage(GEN_CRUD_SUCCESS_MESSAGE)}</Heading>
            <Desc>{createMessage(GEN_CRUD_SUCCESS_DESC)}</Desc>
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
