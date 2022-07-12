import React from "react";

import {
  deleteWorkspaceLogo,
  saveWorkspace,
  uploadWorkspaceLogo,
} from "actions/workspaceActions";
import { SaveWorkspaceRequest } from "api/WorkspaceApi";
import { debounce } from "lodash";
import TextInput, {
  emailValidator,
  notEmptyValidator,
} from "components/ads/TextInput";
import { useSelector, useDispatch } from "react-redux";
import {
  getCurrentError,
  getCurrentWorkspace,
  getWorkspaceLoadingStates,
} from "@appsmith/selectors/workspaceSelectors";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Text, TextType } from "design-system";
import { Classes } from "@blueprintjs/core";
import {
  SetProgress,
  UploadCallback,
  FileType,
} from "components/ads/FilePicker";
import FilePickerV2 from "components/ads/FilePickerV2";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { useMediaQuery } from "react-responsive";

// trigger tests
const GeneralWrapper = styled.div<{
  isMobile?: boolean;
  isPortrait?: boolean;
}>`
  width: ${(props) => (props.isPortrait ? "336px" : "383px")};
  margin: ${(props) =>
    props.isMobile ? (props.isPortrait ? "auto" : "120px") : null};
`;

const InputLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const SettingWrapper = styled.div`
  width: 100%;
  display: flex;
  margin-bottom: 15px;
`;

export const SettingsHeading = styled(Text)`
  color: ${(props) => props.theme.colors.settingHeading};
  display: inline-block;
  margin-top: 25px;
  margin-bottom: 10px;
`;

const Loader = styled.div`
  height: 38px;
  width: 320px;
  border-radius: 0;
`;

const FilePickerLoader = styled.div`
  height: 190px;
  width: 333px;
  border-radius: 0;
`;

// testing
export const Row = styled.div`
  width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
`;

export const Col = styled.div`
  width: 100%;
  margin: 0;
  padding: 0;
`;

export function GeneralSettings() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const dispatch = useDispatch();
  const currentWorkspace = useSelector(getCurrentWorkspace).filter(
    (el) => el.id === workspaceId,
  )[0];
  function saveChanges(settings: SaveWorkspaceRequest) {
    dispatch(saveWorkspace(settings));
  }

  const timeout = 1000;

  const onWorkspaceNameChange = debounce((newName: string) => {
    saveChanges({
      id: workspaceId as string,
      name: newName,
    });
  }, timeout);

  const onWebsiteChange = debounce((newWebsite: string) => {
    saveChanges({
      id: workspaceId as string,
      website: newWebsite,
    });
  }, timeout);

  const onEmailChange = debounce((newEmail: string) => {
    saveChanges({
      id: workspaceId as string,
      email: newEmail,
    });
  }, timeout);

  const { isFetchingWorkspace } = useSelector(getWorkspaceLoadingStates);
  const logoUploadError = useSelector(getCurrentError);

  const FileUploader = (
    file: File,
    setProgress: SetProgress,
    onUpload: UploadCallback,
  ) => {
    const progress = (progressEvent: ProgressEvent) => {
      const uploadPercentage = Math.round(
        (progressEvent.loaded / progressEvent.total) * 100,
      );
      if (uploadPercentage === 100) {
        onUpload(currentWorkspace.logoUrl || "");
      }
      setProgress(uploadPercentage);
    };

    dispatch(
      uploadWorkspaceLogo({
        id: workspaceId as string,
        logo: file,
        progress: progress,
      }),
    );
  };

  const DeleteLogo = () => {
    dispatch(deleteWorkspaceLogo(workspaceId));
  };
  const isFetchingApplications = useSelector(getIsFetchingApplications);

  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  const isPortrait: boolean = useMediaQuery({
    query: "(orientation: portrait)",
  });

  return (
    <GeneralWrapper isMobile={isMobile} isPortrait={isPortrait}>
      <SettingsHeading type={TextType.H1}>
        <Row>
          <Col>General Settings</Col>
        </Row>
      </SettingsHeading>
      <SettingWrapper>
        <Row>
          <Col>
            <InputLabelWrapper>
              <Text type={TextType.P1}>Workspace Name</Text>
            </InputLabelWrapper>
            {isFetchingApplications && <Loader className={Classes.SKELETON} />}
            {!isFetchingApplications && (
              <TextInput
                cypressSelector="t--workspace-name-input"
                defaultValue={currentWorkspace && currentWorkspace.name}
                fill
                onChange={onWorkspaceNameChange}
                placeholder="Workspace Name"
                validator={notEmptyValidator}
              />
            )}
          </Col>
        </Row>
      </SettingWrapper>

      <SettingWrapper>
        <Row className="t--workspace-settings-filepicker">
          <Col>
            <InputLabelWrapper>
              <Text type={TextType.P1}>Upload Logo</Text>
            </InputLabelWrapper>
            {isFetchingWorkspace && (
              <FilePickerLoader className={Classes.SKELETON} />
            )}
            {!isFetchingWorkspace && (
              <FilePickerV2
                fileType={FileType.IMAGE}
                fileUploader={FileUploader}
                logoUploadError={logoUploadError.message}
                onFileRemoved={DeleteLogo}
                url={currentWorkspace && currentWorkspace.logoUrl}
              />
            )}
          </Col>
        </Row>
      </SettingWrapper>

      <SettingWrapper>
        <Row>
          <Col>
            <InputLabelWrapper>
              <Text type={TextType.P1}>Website</Text>
            </InputLabelWrapper>
            {isFetchingApplications && <Loader className={Classes.SKELETON} />}
            {!isFetchingApplications && (
              <TextInput
                cypressSelector="t--workspace-website-input"
                defaultValue={
                  (currentWorkspace && currentWorkspace.website) || ""
                }
                fill
                onChange={onWebsiteChange}
                placeholder="Your website"
              />
            )}
          </Col>
        </Row>
      </SettingWrapper>

      <SettingWrapper>
        <Row>
          <Col>
            <InputLabelWrapper>
              <Text type={TextType.P1}>Email</Text>
            </InputLabelWrapper>
            {isFetchingApplications && <Loader className={Classes.SKELETON} />}
            {!isFetchingApplications && (
              <TextInput
                cypressSelector="t--workspace-email-input"
                defaultValue={
                  (currentWorkspace && currentWorkspace.email) || ""
                }
                fill
                onChange={onEmailChange}
                placeholder="Email"
                validator={emailValidator}
              />
            )}
          </Col>
        </Row>
      </SettingWrapper>
    </GeneralWrapper>
  );
}
