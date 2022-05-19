import React, { ReactNode, useCallback, useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import { useSelector } from "store";
import { FileType, SetProgress } from "components/ads/FilePicker";
import { useDispatch } from "react-redux";
import {
  importApplication,
  setWorkspaceIdForImport,
} from "actions/applicationActions";
import {
  createMessage,
  IMPORT_APP_FROM_FILE_MESSAGE,
  IMPORT_APP_FROM_FILE_TITLE,
  IMPORT_APP_FROM_GIT_MESSAGE,
  IMPORT_APP_FROM_GIT_TITLE,
  IMPORT_APPLICATION_MODAL_LABEL,
  IMPORT_APPLICATION_MODAL_TITLE,
} from "@appsmith/constants/messages";
import FilePickerV2 from "components/ads/FilePickerV2";
import { Colors } from "constants/Colors";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import { getIsImportingApplication } from "selectors/applicationSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import Dialog from "components/ads/DialogComponent";
import { Classes } from "@blueprintjs/core";
import { selectFeatureFlags } from "selectors/usersSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

const StyledDialog = styled(Dialog)`
  && .${Classes.DIALOG_HEADER} {
    min-height: unset;

    & .${Classes.DIALOG_CLOSE_BUTTON} {
      margin-top: -2px;
    }

    & .${Classes.ICON} {
      &:hover {
        & svg path {
          fill: ${Colors.GREY_800};
        }
      }

      & svg {
        margin-right: ${(props) => props.theme.spaces[3]}px;

        & path {
          fill: ${Colors.GREY_7};
        }
      }
    }
  }

  && .${Classes.DIALOG_BODY} {
    padding: 0;
    margin-bottom: 0;
    margin-top: 8px;
  }
`;

const TextWrapper = styled.div`
  padding: 0;
  margin-bottom: ${(props) => props.theme.spaces[12] + 4}px;
  margin-top: ${(props) => props.theme.spaces[11]}px;
`;

const Row = styled.div`
  display: flex;
  padding: 0;
  margin: 0;
  justify-content: space-between;
`;

const FileImportCard = styled.div<{ gitEnabled?: boolean }>`
  width: ${(props) => (props.gitEnabled ? "320px" : "100%")};
  height: 200px;
  border: 1px solid ${Colors.GREY_4};
  display: flex;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  position: relative;

  &:hover {
    background: ${Colors.GREY_4};
  }

  & > div {
    background: transparent none;

    .upload-form-container {
      padding-top: 0;
    }

    .button-wrapper {
      width: 100%;
      height: 100%;
      justify-content: flex-start;

      .cs-icon {
        border-radius: 50%;
        width: ${(props) => props.theme.spaces[12] + 2}px;
        height: ${(props) => props.theme.spaces[12] + 2}px;
        background: ${Colors.GREY_4};
        display: flex;
        justify-content: center;
        margin-top: 35px;
        margin-bottom: 32px;
        color: ${Colors.GREY_800} !important;

        svg {
          width: ${(props) => props.theme.iconSizes.XL}px;
          height: ${(props) => props.theme.iconSizes.XL}px;

          path {
            color: ${Colors.GREY_800} !important;
          }
        }
      }

      .cs-text {
        max-width: 220px;
        text-align: center;
        margin-top: 0;
        font-size: ${(props) => props.theme.typography.p1.fontSize}px;

        &.drag-drop-text {
          color: ${Colors.OXFORD_BLUE};
        }

        &.drag-drop-description {
          color: ${Colors.GREY_800};
        }
      }
    }
  }
`;

const CardWrapper = styled.div`
  width: 320px;
  height: 200px;
  border: 1px solid ${Colors.GREY_4};
  display: flex;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  position: relative;

  &:hover {
    background: ${Colors.GREY_4};
  }

  .cs-icon {
    border-radius: 50%;
    width: 32px;
    height: 32px;
    background: ${Colors.GREY_4};
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

function GitImportCard(props: { children?: ReactNode; handler?: () => void }) {
  const theme = useTheme() as Theme;
  const onClick = useCallback(() => {
    AnalyticsUtil.logEvent("GS_IMPORT_VIA_GIT_CARD_CLICK");
    props.handler && props.handler();
  }, []);
  const message = createMessage(IMPORT_APP_FROM_GIT_MESSAGE);
  const title = createMessage(IMPORT_APP_FROM_GIT_TITLE);
  return (
    <CardWrapper onClick={onClick}>
      <Icon fillColor={Colors.GREY_800} name={"fork"} size={IconSize.XL} />
      <Text
        color={Colors.OXFORD_BLUE}
        style={{ marginBottom: theme.spaces[4] }}
        type={TextType.P1}
      >
        {title}
      </Text>
      <Text color={Colors.GREY_800} type={TextType.P1}>
        {message}
      </Text>
      {props.children}
    </CardWrapper>
  );
}

type ImportApplicationModalProps = {
  // import?: (file: any) => void;
  workspaceId?: string;
  isModalOpen?: boolean;
  onClose?: () => void;
};

function ImportApplicationModal(props: ImportApplicationModalProps) {
  const { isModalOpen, onClose, workspaceId } = props;
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);

  const dispatch = useDispatch();
  const onGitImport = useCallback(() => {
    onClose && onClose();
    dispatch({
      type: ReduxActionTypes.GIT_INFO_INIT,
    });
    dispatch(setWorkspaceIdForImport(workspaceId));

    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.GIT_CONNECTION,
      }),
    );

    // dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: true }));
  }, []);

  const importingApplication = useSelector(getIsImportingApplication);

  const FileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      if (!!file) {
        setAppFileToBeUploaded({
          file,
          setProgress,
        });
        dispatch(
          importApplication({
            workspaceId: workspaceId as string,
            applicationFile: file,
          }),
        );
        onClose && onClose();
      } else {
        setAppFileToBeUploaded(null);
      }
    },
    [],
  );

  useEffect(() => {
    // finished of importing application
    if (appFileToBeUploaded && !importingApplication) {
      setAppFileToBeUploaded(null);
      // should open "Add credential" modal
    }
  }, [appFileToBeUploaded, importingApplication]);

  const onRemoveFile = useCallback(() => setAppFileToBeUploaded(null), []);

  const featureFlags = useSelector(selectFeatureFlags);
  const { GIT_IMPORT: isGitImportFeatureEnabled } = featureFlags;

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
      title={createMessage(IMPORT_APPLICATION_MODAL_TITLE)}
      width="710px"
    >
      <TextWrapper>
        <Text color={Colors.COD_GRAY} type={TextType.P1}>
          {createMessage(IMPORT_APPLICATION_MODAL_LABEL)}
        </Text>
      </TextWrapper>
      <Row>
        <FileImportCard
          className="t--import-json-card"
          gitEnabled={isGitImportFeatureEnabled}
        >
          <FilePickerV2
            containerClickable
            description={createMessage(IMPORT_APP_FROM_FILE_MESSAGE)}
            fileType={FileType.JSON}
            fileUploader={FileUploader}
            iconFillColor={Colors.GREY_800}
            onFileRemoved={onRemoveFile}
            title={createMessage(IMPORT_APP_FROM_FILE_TITLE)}
            uploadIcon="file-line"
          />
        </FileImportCard>
        {isGitImportFeatureEnabled && <GitImportCard handler={onGitImport} />}
      </Row>
    </StyledDialog>
  );
}

export default ImportApplicationModal;
