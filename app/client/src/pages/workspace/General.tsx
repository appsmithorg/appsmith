import React from "react";

import {
  deleteWorkspaceLogo,
  saveWorkspace,
  uploadWorkspaceLogo,
} from "@appsmith/actions/workspaceActions";
import type { SaveWorkspaceRequest } from "@appsmith/api/WorkspaceApi";
import { debounce } from "lodash";
import { Input } from "design-system";
import { useSelector, useDispatch } from "react-redux";
import {
  getCurrentError,
  getCurrentWorkspace,
  getWorkspaceLoadingStates,
} from "@appsmith/selectors/workspaceSelectors";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import type { SetProgress, UploadCallback } from "design-system-old";
import { FilePickerV2, FileType, Text, TextType } from "design-system-old";
import { Classes } from "@blueprintjs/core";
import { getIsFetchingApplications } from "@appsmith/selectors/applicationSelectors";
import { useMediaQuery } from "react-responsive";

// trigger tests
const GeneralWrapper = styled.div<{
  isMobile?: boolean;
  isPortrait?: boolean;
}>`
  width: 340px;
  padding: 20px 20px;
  margin: 0 auto;
  .drag-drop-text {
    color: var(--ads-v2-color-fg);
    + form a {
      --button-padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
      background-color: var(--ads-v2-color-bg);
      border: 1px solid var(--ads-v2-color-border);
      width: 100%;
      height: 100%;
      padding: var(--button-padding);
      border-radius: var(--ads-v2-border-radius);
      text-transform: capitalize;
      &:hover {
        background-color: var(--ads-v2-color-bg-subtle);
        color: var(--ads-v2-color-fg);
        border-color: var(--ads-v2-color-border);
      }
    }
  }
`;

const InputLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  span {
    color: var(--ads-v2-color-fg);
  }
`;

const SettingWrapper = styled.div`
  width: 100%;
  display: flex;
  margin-bottom: 15px;
`;

const Loader = styled.div`
  height: 38px;
  width: 320px;
  border-radius: var(--ads-v2-border-radius);
`;

const FilePickerLoader = styled.div`
  height: 190px;
  width: 333px;
  border-radius: 0;
`;

// testing
export const Row = styled.div`
  width: 100%;
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
      <SettingWrapper>
        <Row>
          {isFetchingApplications && <Loader className={Classes.SKELETON} />}
          {!isFetchingApplications && (
            <Input
              data-testid="t--workspace-name-input"
              defaultValue={currentWorkspace && currentWorkspace.name}
              isRequired
              label="Display name"
              labelPosition="top"
              onChange={onWorkspaceNameChange}
              placeholder="Workspace Name"
              renderAs="input"
              size="md"
              type="text"
            />
          )}
        </Row>
      </SettingWrapper>

      <SettingWrapper>
        <Row className="t--workspace-settings-filepicker">
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
        </Row>
      </SettingWrapper>

      <SettingWrapper>
        <Row>
          {isFetchingApplications && <Loader className={Classes.SKELETON} />}
          {!isFetchingApplications && (
            <Input
              data-testid="t--workspace-website-input"
              defaultValue={
                (currentWorkspace && currentWorkspace.website) || ""
              }
              label="Website"
              labelPosition="top"
              onChange={onWebsiteChange}
              placeholder="Your website"
              renderAs="input"
              size="md"
              type="text"
            />
          )}
        </Row>
      </SettingWrapper>

      <SettingWrapper>
        <Row>
          {isFetchingApplications && <Loader className={Classes.SKELETON} />}
          {!isFetchingApplications && (
            <Input
              data-testid="t--workspace-email-input"
              defaultValue={(currentWorkspace && currentWorkspace.email) || ""}
              label="Email"
              labelPosition="top"
              onChange={onEmailChange}
              placeholder="Email"
              renderAs="input"
              size="md"
              type="text"
            />
          )}
        </Row>
      </SettingWrapper>
    </GeneralWrapper>
  );
}
