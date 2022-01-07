import React, { useCallback, useState } from "react";
import styled, { useTheme } from "styled-components";
import Button, { Size } from "components/ads/Button";
import { StyledDialog } from "./ForkModalStyles";
import { useSelector } from "store";
import { AppState } from "reducers";
import { SetProgress, FileType } from "components/ads/FilePicker";
import { useDispatch } from "react-redux";
import { importApplication } from "actions/applicationActions";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { IMPORT_APPLICATION_MODAL_TITLE } from "constants/messages";
import FilePickerV2 from "components/ads/FilePickerV2";
import { Colors } from "constants/Colors";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";

const ImportButton = styled(Button)<{ disabled?: boolean }>`
  height: 30px;
  width: 81px;
  pointer-events: ${(props) => (!!props.disabled ? "none" : "auto")};
`;

const TextWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[11]}px;
  padding-bottom: ${(props) => props.theme.spaces[12] + 2}px;
`;

const Row = styled.div`
  display: flex;
  padding: 0px;
  margin: 0px;
  justify-content: space-between;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${(props) => props.theme.spaces[6]}px;
`;

const FilePickerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardWrapper = styled.div`
  width: 320px;
  height: 200px;
  border: 1px solid ${Colors.MERCURY};
  display: flex;
  align-items: center;
  flex-direction: column;
  &:hover {
    background: ${Colors.MERCURY};
  }
  .cs-icon {
    border-radius: 50%;
    width: 32px;
    height: 32px;
    background: ${Colors.MERCURY};
    display: flex;
    justify-content: center;
    margin-top: 35px;
    margin-bottom: 32px;
  }
  .cs-text {
    max-width: 250px;
    text-align: center;
  }
`;

type ImportApplicationModalProps = {
  // import?: (file: any) => void;
  organizationId?: string;
  isModalOpen?: boolean;
  onClose?: () => void;
};

function ImportApplicationModal(props: ImportApplicationModalProps) {
  const { isModalOpen, onClose, organizationId } = props;
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);
  const dispatch = useDispatch();

  const importingApplication = useSelector(
    (state: AppState) => state.ui.applications.importingApplication,
  );

  const FileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      if (!!file) {
        setAppFileToBeUploaded({
          file,
          setProgress,
        });
      } else {
        setAppFileToBeUploaded(null);
      }
    },
    [],
  );

  const onImportApplication = useCallback(() => {
    if (!appFileToBeUploaded) {
      Toaster.show({
        text: "Please choose a valid application file!",
        variant: Variant.danger,
      });
      return;
    }
    const { file } = appFileToBeUploaded || {};

    dispatch(
      importApplication({
        orgId: organizationId as string,
        applicationFile: file,
      }),
    );
  }, [appFileToBeUploaded, organizationId]);

  const onRemoveFile = useCallback(() => setAppFileToBeUploaded(null), []);
  const theme = useTheme() as Theme;
  return (
    <StyledDialog
      canOutsideClickClose
      className={"t--import-application-modal"}
      headerIcon={{
        name: "right-arrow",
        bgColor: Colors.GEYSER_LIGHT,
      }}
      isOpen={isModalOpen}
      maxHeight={"540px"}
      setModalClose={onClose}
      title={IMPORT_APPLICATION_MODAL_TITLE()}
      width="710px"
    >
      <TextWrapper>
        <Text type={TextType.P1}>
          Where would you like to import your application from?
        </Text>
      </TextWrapper>
      <Row>
        <CardWrapper>
          <Icon name="file-line" size={IconSize.XL} />
          <Text
            color={Colors.OXFORD_BLUE}
            style={{ marginBottom: theme.spaces[4] }}
            type={TextType.P1}
          >
            Import from file
          </Text>
          <Text color={Colors.GREY_6} type={TextType.P1}>
            Drag and drop your file or upload from your computer
          </Text>
        </CardWrapper>
        <CardWrapper>
          <Icon name="fork" size={IconSize.XL} />
          <Text
            color={Colors.OXFORD_BLUE}
            style={{ marginBottom: theme.spaces[4] }}
            type={TextType.P1}
          >
            Import for Github
          </Text>
          <Text color={Colors.GREY_6} type={TextType.P1}>
            Use SSH link from your repository to import application
          </Text>
        </CardWrapper>
      </Row>
      {/* <ButtonWrapper>
        <ImportButton
          // category={ButtonCategory.tertiary}
          cypressSelector={"t--org-import-app-button"}
          disabled={!appFileToBeUploaded}
          isLoading={importingApplication}
          onClick={onImportApplication}
          size={Size.large}
          text={"IMPORT"}
        />
      </ButtonWrapper> */}
    </StyledDialog>
  );
}

export default ImportApplicationModal;
