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
import FilePicker, {
  SetProgress,
  UploadCallback,
  FileType,
} from "components/ads/FilePicker";
import { getIsFetchingApplications } from "selectors/applicationSelectors";

// trigger tests

const InputLabelWrapper = styled.div`
  width: 150px;
  display: flex;
  align-items: center;
`;

const SettingWrapper = styled.div`
  width: 520px;
  display: flex;
  margin-bottom: 25px;
`;

export const SettingsHeading = styled(Text)`
  color: ${(props) => props.theme.colors.settingHeading};
  display: inline-block;
  margin-top: 25px;
  margin-bottom: 32px;
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
  margin: 0;
  padding: 0;
  display: flex;
`;

export const Col = styled.div`
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

  return (
    <>
      <SettingsHeading type={TextType.H2}>
        <Row>
          <Col>General</Col>
        </Row>
      </SettingsHeading>
      <SettingWrapper>
        <Row>
          <Col>
            <InputLabelWrapper>
              <Text type={TextType.H4}>Organization Name</Text>
            </InputLabelWrapper>
          </Col>
          <Col>
            {isFetchingApplications && <Loader className={Classes.SKELETON} />}
            {!isFetchingApplications && (
              <TextInput
                cypressSelector="t--org-name-input"
                defaultValue={currentOrg && currentOrg.name}
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
              <Text type={TextType.H4}>Upload Logo</Text>
            </InputLabelWrapper>
          </Col>
          <Col>
            {isFetchingOrg && <FilePickerLoader className={Classes.SKELETON} />}
            {!isFetchingOrg && (
              <FilePicker
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
              <Text type={TextType.H4}>Website</Text>
            </InputLabelWrapper>
          </Col>
          <Col>
            {isFetchingApplications && <Loader className={Classes.SKELETON} />}
            {!isFetchingApplications && (
              <TextInput
                cypressSelector="t--org-website-input"
                defaultValue={(currentOrg && currentOrg.website) || ""}
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
              <Text type={TextType.H4}>Email</Text>
            </InputLabelWrapper>
          </Col>
          <Col>
            {isFetchingApplications && <Loader className={Classes.SKELETON} />}
            {!isFetchingApplications && (
              <TextInput
                cypressSelector="t--org-email-input"
                defaultValue={(currentOrg && currentOrg.email) || ""}
                onChange={onEmailChange}
                placeholder="Email"
                validator={emailValidator}
              />
            )}
          </Col>
        </Row>
      </SettingWrapper>
    </>
  );
}
