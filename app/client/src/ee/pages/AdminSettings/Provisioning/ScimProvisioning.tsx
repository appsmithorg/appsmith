import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import styled from "styled-components";
import {
  Button,
  Callout,
  Icon,
  Link,
  Spinner,
  Text,
  Tooltip,
} from "design-system";
import { BackButton } from "components/utils/helperComponents";
import {
  BottomSpace,
  HeaderWrapper,
  SettingsFormWrapper,
  SettingsHeader,
  SettingsSubHeader,
  Wrapper,
} from "pages/Settings/components";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import { GOOGLE_SIGNUP_SETUP_DOC } from "constants/ThirdPartyConstants";
import CopyUrlForm from "pages/Settings/FormGroup/CopyUrlForm";
import { getProvisioningDetails } from "@appsmith/selectors/provisioningSelectors";
import {
  fetchProvisioningStatus,
  generateProvisioningApiKey,
} from "@appsmith/actions/provisioningActions";
import DisableScimModal from "./DisableScimModal";
import type { ScimProps } from "./types";
import {
  API_KEY_TO_SETUP_SCIM,
  CONNECTION_ACTIVE,
  CONNECTION_INACTIVE,
  COPY_PASTE_API_KEY_CALLOUT,
  createMessage,
  DISABLE_SCIM,
  GENERATE_API_KEY,
  LAST_SYNC_MESSAGE,
  OPEN_DOCUMENTATION,
  RECONFIGURE_API_KEY,
  SCIM_API_ENDPOINT,
  SCIM_API_ENDPOINT_HELP_TEXT,
  SCIM_CALLOUT_HEADING,
  SCIM_CALLOUT_LIST,
} from "@appsmith/constants/messages";
import SyncedResourcesInfo from "./SyncedResourcesInfo";
import { howMuchTimeBeforeText } from "utils/helpers";

const StyledSettingsHeader = styled(SettingsHeader)`
  display: flex;
  gap: var(--ads-v2-spaces-3);
  align-items: center;
`;

const CalloutList = styled.ol`
  list-style: auto;
  padding: 0 16px;
`;

const ContentWrapper = styled.div`
  & .callout-link {
    > div {
      margin-top: 0px;
      margin-bottom: 12px;
    }
  }
`;

const APIKeyContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-2);

  button {
    width: fit-content;
  }

  .api-key {
    display: flex;
    flex-direction: column;
  }
`;

const Connected = styled.div`
  padding-bottom: 24px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ConnectionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
`;

const ConnectionStatus = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-3);
`;

const StyledCallout = styled(Callout)`
  position: relative;
  top: -8px;
`;

const CalloutContent = () => {
  return (
    <>
      <div>{createMessage(SCIM_CALLOUT_HEADING)}</div>
      <CalloutList>
        {SCIM_CALLOUT_LIST.map((item: string, index: number) => (
          <li key={index}>{item}</li>
        ))}
      </CalloutList>
    </>
  );
};

const ScimConnectionContent = (props: ScimProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { provisioningDetails } = props;
  const howMuchTimeBefore = provisioningDetails.lastUpdatedAt
    ? howMuchTimeBeforeText(provisioningDetails.lastUpdatedAt)
    : "";

  return (
    <Connected>
      <ConnectionInfo>
        {provisioningDetails.provisionStatus === "active" ? (
          <ConnectionStatus>
            <Icon
              color="var(--ads-v2-color-fg-success)"
              name="cloud"
              size="md"
            />
            <Text kind="heading-s">{createMessage(CONNECTION_ACTIVE)}</Text>
          </ConnectionStatus>
        ) : (
          <ConnectionStatus>
            <Icon
              color="var(--ads-v2-color-fg-error)"
              name="cloud-off-line"
              size="md"
            />
            <Text kind="heading-s">{createMessage(CONNECTION_INACTIVE)}</Text>
          </ConnectionStatus>
        )}
        <Text color="var(--ads-v2-color-fg-muted)" data-testid="last-sync-info">
          {createMessage(LAST_SYNC_MESSAGE, howMuchTimeBefore)}
        </Text>
        <SyncedResourcesInfo provisioningDetails={provisioningDetails} />
      </ConnectionInfo>
      <Button
        UNSAFE_height="36px"
        isLoading={provisioningDetails.isLoading.disconnectProvisioning}
        kind="error"
        onClick={() => setIsModalOpen(true)}
      >
        {createMessage(DISABLE_SCIM)}
      </Button>
      <DisableScimModal
        isModalOpen={isModalOpen}
        provisioningDetails={provisioningDetails}
        setIsModalOpen={setIsModalOpen}
      />
    </Connected>
  );
};

function getSettingLabel(name = "") {
  return name.replace(/-/g, "");
}

function getSettingDetail(category: string, subCategory: string) {
  return AdminConfig.getCategoryDetails(category, subCategory);
}

export const ScimProvisioning = () => {
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const provisioningDetails = useSelector(getProvisioningDetails);
  const { apiKey, configuredStatus = false, isLoading } = provisioningDetails;
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const details = getSettingDetail(category, subCategory);
  const pageTitle = getSettingLabel(
    details?.title || (subCategory ?? category),
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProvisioningStatus());
  }, [configuredStatus]);

  const generateApiKey = () => {
    setIsButtonClicked(true);
    dispatch(generateProvisioningApiKey());
    if (configuredStatus) {
      dispatch(fetchProvisioningStatus());
    }
  };

  if (isLoading.provisionStatus) {
    return <Spinner />;
  }

  return (
    <Wrapper>
      {subCategory && <BackButton />}
      <SettingsFormWrapper>
        <HeaderWrapper>
          <StyledSettingsHeader
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h1"
          >
            {pageTitle}
            <Tooltip
              content={createMessage(OPEN_DOCUMENTATION)}
              placement="bottom"
              trigger="hover"
            >
              <span>
                <Link
                  endIcon="book-line"
                  target="_blank"
                  to={GOOGLE_SIGNUP_SETUP_DOC}
                >
                  {""}
                </Link>
              </span>
            </Tooltip>
          </StyledSettingsHeader>
          {details?.subText && !configuredStatus && (
            <SettingsSubHeader
              color="var(--ads-v2-color-fg-emphasis)"
              kind="body-m"
              renderAs="h2"
            >
              {details.subText}
            </SettingsSubHeader>
          )}
        </HeaderWrapper>
        <ContentWrapper>
          {configuredStatus ? (
            <ScimConnectionContent provisioningDetails={provisioningDetails} />
          ) : (
            <div
              className="callout-link t--oepn-doc-link"
              data-testid="scim-callout"
            >
              <Callout
                kind={"info"}
                links={[
                  {
                    children: createMessage(OPEN_DOCUMENTATION),
                    to: GOOGLE_SIGNUP_SETUP_DOC,
                    startIcon: "book-line",
                  },
                ]}
              >
                <CalloutContent />
              </Callout>
            </div>
          )}
          <div className="scim-api-endpoint-link">
            <CopyUrlForm
              fieldName="scim-api-endpoint"
              helpText={createMessage(SCIM_API_ENDPOINT_HELP_TEXT)}
              title={createMessage(SCIM_API_ENDPOINT)}
              value={"/scim"}
            />
          </div>
          <APIKeyContent>
            {apiKey && isButtonClicked ? (
              <div className="api-key" data-testid="scim-api-key">
                <CopyUrlForm
                  append={false}
                  fieldName="scim-api-key"
                  startIcon="key-2-line"
                  title={createMessage(API_KEY_TO_SETUP_SCIM)}
                  value={apiKey}
                />
                <StyledCallout kind={"warning"}>
                  {createMessage(COPY_PASTE_API_KEY_CALLOUT)}
                </StyledCallout>
              </div>
            ) : (
              <>
                <Text>{createMessage(API_KEY_TO_SETUP_SCIM)}</Text>
                <Button
                  UNSAFE_height="36px"
                  isLoading={isLoading.apiKey}
                  kind="secondary"
                  onClick={generateApiKey}
                >
                  {configuredStatus
                    ? createMessage(RECONFIGURE_API_KEY)
                    : createMessage(GENERATE_API_KEY)}
                </Button>
              </>
            )}
          </APIKeyContent>
        </ContentWrapper>
        <BottomSpace />
      </SettingsFormWrapper>
    </Wrapper>
  );
};
