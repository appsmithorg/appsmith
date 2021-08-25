import React from "react";
import styled from "styled-components";
import { connect, useDispatch } from "react-redux";
import { AppState } from "reducers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Button, { Category, Size } from "components/ads/Button";
import Text, { TextType } from "components/ads/Text";
import { getCrudInfoModalData } from "selectors/crudInfoModalSelectors";
import { setCrudInfoModalData } from "actions/crudInfoModalActions";
import { Colors } from "constants/Colors";
import { S3_BUCKET_URL } from "constants/ThirdPartyConstants";

import Dialog from "components/ads/DialogComponent";
import { GEN_CRUD_INFO_DIALOG_HEADING } from "../../../../constants/messages";
import { GenerateCRUDSuccessInfoData } from "../../../../reducers/uiReducers/crudInfoModalReducer";
import { GEN_CRUD_INFO_DIALOG_SUBTITLE } from "constants/messages";

type Props = {
  crudInfoModalOpen: boolean;
  generateCRUDSuccessInfo: GenerateCRUDSuccessInfoData | null;
};

const HeaderContents = styled.div`
  padding: ${(props) => props.theme.spaces[9]}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: ${(props) => props.theme.spaces[7]}px;
  background-color: ${Colors.FOAM};
`;

const Heading = styled.div`
  color: ${(props) => props.theme.colors.modal.headerText};
  display: flex;
  justify-content: center;
  font-size: 20px;
  line-height: 24px;
  color: ${(props) => props.theme.colors.success.dark};
`;

const ActionButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
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

  .info-subtitle {
    padding-top: 5px;
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

function Header() {
  return (
    <HeaderContents>
      <Heading> {GEN_CRUD_INFO_DIALOG_HEADING()}</Heading>
    </HeaderContents>
  );
}

const getInfoImage = (): string =>
  `${S3_BUCKET_URL}/crud/working-flow-chart.png`;

function GenCRUDSuccessModal(props: Props) {
  const { crudInfoModalOpen, generateCRUDSuccessInfo } = props;

  const dispatch = useDispatch();

  const onClose = () => {
    AnalyticsUtil.logEvent("CLOSE_GEN_PAGE_INFO_MODAL");
    dispatch(setCrudInfoModalData({ open: false }));
  };

  const successMessage =
    (generateCRUDSuccessInfo && generateCRUDSuccessInfo.successMessage) ||
    GEN_CRUD_INFO_DIALOG_SUBTITLE();

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      isOpen={crudInfoModalOpen}
      setModalClose={onClose}
    >
      <Wrapper>
        <Header />
        <Content>
          <Text
            className="info-subtitle"
            dangerouslySetInnerHTML={{
              __html: successMessage,
            }}
            type={TextType.P1}
          />
          <ImageWrapper>
            <InfoImage
              alt="CRUD Info"
              src={
                generateCRUDSuccessInfo &&
                generateCRUDSuccessInfo.successImageUrl
                  ? generateCRUDSuccessInfo.successImageUrl
                  : getInfoImage()
              }
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
      </Wrapper>
    </Dialog>
  );
}

const mapStateToProps = (state: AppState) => ({
  crudInfoModalOpen: getCrudInfoModalData(state).crudInfoModalOpen,
  generateCRUDSuccessInfo: getCrudInfoModalData(state).generateCRUDSuccessInfo,
});

export default connect(mapStateToProps)(GenCRUDSuccessModal);
