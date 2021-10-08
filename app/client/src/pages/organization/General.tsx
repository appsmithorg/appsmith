import React from "react";

import { deleteOrgLogo, saveOrg, uploadOrgLogo } from "actions/orgActions";
import { SaveOrgRequest } from "api/OrgApi";
import { debounce } from "lodash";
import TextInput, {
  emailValidator,
  notEmptyValidator,
} from "components/ads/TextInput";
import { useSelector, useDispatch } from "react-redux";
import {
  getCurrentError,
  getCurrentOrg,
} from "selectors/organizationSelectors";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "@blueprintjs/core";
import { getOrgLoadingStates } from "selectors/organizationSelectors";
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
  const { orgId } = useParams<{ orgId: string }>();
  const dispatch = useDispatch();
  const currentOrg = useSelector(getCurrentOrg).filter(
    (el) => el.id === orgId,
  )[0];
  function saveChanges(settings: SaveOrgRequest) {
    dispatch(saveOrg(settings));
  }

  const timeout = 1000;

  const onWorkspaceNameChange = debounce((newName: string) => {
    saveChanges({
      id: orgId as string,
      name: newName,
    });
  }, timeout);

  const onWebsiteChange = debounce((newWebsite: string) => {
    saveChanges({
      id: orgId as string,
      website: newWebsite,
    });
  }, timeout);

  const onEmailChange = debounce((newEmail: string) => {
    saveChanges({
      id: orgId as string,
      email: newEmail,
    });
  }, timeout);

  const { isFetchingOrg } = useSelector(getOrgLoadingStates);
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
        onUpload(currentOrg.logoUrl || "");
      }
      setProgress(uploadPercentage);
    };

    dispatch(
      uploadOrgLogo({
        id: orgId as string,
        logo: file,
        progress: progress,
      }),
    );
  };

  const DeleteLogo = () => {
    dispatch(deleteOrgLogo(orgId));
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
              <Text type={TextType.P1}>Organization Name</Text>
            </InputLabelWrapper>
            {isFetchingApplications && <Loader className={Classes.SKELETON} />}
            {!isFetchingApplications && (
              <TextInput
                cypressSelector="t--org-name-input"
                defaultValue={currentOrg && currentOrg.name}
                fill
                onChange={onWorkspaceNameChange}
                placeholder="Organization Name"
                validator={notEmptyValidator}
              />
            )}
          </Col>
        </Row>
      </SettingWrapper>

      <SettingWrapper>
        <Row className="t--organization-settings-filepicker">
          <Col>
            <InputLabelWrapper>
              <Text type={TextType.P1}>Upload Logo</Text>
            </InputLabelWrapper>
            {isFetchingOrg && <FilePickerLoader className={Classes.SKELETON} />}
            {!isFetchingOrg && (
              <FilePickerV2
                fileType={FileType.IMAGE}
                fileUploader={FileUploader}
                logoUploadError={logoUploadError.message}
                onFileRemoved={DeleteLogo}
                url={currentOrg && currentOrg.logoUrl}
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
                cypressSelector="t--org-website-input"
                defaultValue={(currentOrg && currentOrg.website) || ""}
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
                cypressSelector="t--org-email-input"
                defaultValue={(currentOrg && currentOrg.email) || ""}
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
