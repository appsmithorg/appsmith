import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import styled from "styled-components";
import {
  Button,
  Callout,
  Icon,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Text,
  Tooltip,
} from "design-system";
import { BackButton } from "components/utils/helperComponents";
import {
  BottomSpace,
  HeaderWrapper,
  LoaderContainer,
  SettingsFormWrapper,
  SettingsHeader,
  SettingsSubHeader,
  Wrapper,
} from "pages/Settings/components";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import { PROVISIONING_SETUP_DOC } from "constants/ThirdPartyConstants";
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
  RECONFIGURE_API_KEY_MODAL_CANCEL_BUTTON,
  RECONFIGURE_API_KEY_MODAL_CONTENT,
  RECONFIGURE_API_KEY_MODAL_SUBMIT_BUTTON,
  RECONFIGURE_API_KEY_MODAL_TITLE,
  SCIM_API_ENDPOINT,
  SCIM_API_ENDPOINT_HELP_TEXT,
  SCIM_CALLOUT_HEADING,
  SCIM_CALLOUT_LIST,
} from "@appsmith/constants/messages";
import { howMuchTimeBeforeText } from "utils/helpers";
import ResourceLinks from "./ResourceLinks";
import AnalyticsUtil from "utils/AnalyticsUtil";

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

  const onDisableClick = () => {
    setIsModalOpen(true);
    AnalyticsUtil.logEvent("SCIM_DISABLE_CLICKED");
  };

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
            <Text data-testid="t--connection-status" kind="heading-s">
              {createMessage(CONNECTION_ACTIVE)}
            </Text>
          </ConnectionStatus>
        ) : (
          <ConnectionStatus>
            <Icon
              color="var(--ads-v2-color-fg-error)"
              name="cloud-off-line"
              size="md"
            />
            <Text data-testid="t--connection-status" kind="heading-s">
              {createMessage(CONNECTION_INACTIVE)}
            </Text>
          </ConnectionStatus>
        )}
        <Text
          color="var(--ads-v2-color-fg-muted)"
          data-testid="t--last-sync-info"
        >
          {createMessage(LAST_SYNC_MESSAGE, howMuchTimeBefore)}
        </Text>
        <div data-testid="t--synced-resources-info">
          <ResourceLinks
            origin="SCIM"
            provisionedGroups={provisioningDetails.provisionedGroups}
            provisionedUsers={provisioningDetails.provisionedUsers}
          />
          <Text>are linked to your IdP</Text>
        </div>
      </ConnectionInfo>
      <Button
        UNSAFE_height="36px"
        data-testid="t--disable-scim-btn"
        isLoading={provisioningDetails.isLoading.disconnectProvisioning}
        kind="error"
        onClick={onDisableClick}
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
  const [showReconfigureApiKeyModal, setShowReconfigureApiKeyModal] =
    useState(false);
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
    if (!configuredStatus) {
      AnalyticsUtil.logEvent("SCIM_GENERATE_KEY_CLICKED");
    }

    setIsButtonClicked(true);
    dispatch(generateProvisioningApiKey(configuredStatus));
  };

  const openReconfigureApiKeyModal = () => {
    setShowReconfigureApiKeyModal(true);
    AnalyticsUtil.logEvent("SCIM_RECONFIGURE_KEY_CLICKED");
  };

  const confirmReconfigureApiKey = () => {
    generateApiKey();
    AnalyticsUtil.logEvent("SCIM_RECONFIGURE_KEY_CONFIRMED");
  };

  if (isLoading.provisionStatus) {
    return (
      <LoaderContainer>
        <Spinner size="lg" />
      </LoaderContainer>
    );
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
                  data-testid="scim-setup-doc-link"
                  endIcon="book-line"
                  target="_blank"
                  to={PROVISIONING_SETUP_DOC}
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
                    to: PROVISIONING_SETUP_DOC,
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
                  data-testid="t--generate-api-key"
                  isLoading={isLoading.apiKey}
                  kind="secondary"
                  onClick={() =>
                    configuredStatus
                      ? openReconfigureApiKeyModal()
                      : generateApiKey()
                  }
                >
                  {configuredStatus
                    ? createMessage(RECONFIGURE_API_KEY)
                    : createMessage(GENERATE_API_KEY)}
                </Button>
                <Modal
                  onOpenChange={(isOpen) =>
                    showReconfigureApiKeyModal &&
                    setShowReconfigureApiKeyModal(isOpen)
                  }
                  open={showReconfigureApiKeyModal}
                >
                  <ModalContent style={{ width: "640px" }}>
                    <ModalHeader>
                      {createMessage(RECONFIGURE_API_KEY_MODAL_TITLE)}
                    </ModalHeader>
                    <ModalBody>
                      <Text>
                        {createMessage(RECONFIGURE_API_KEY_MODAL_CONTENT)}
                      </Text>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        UNSAFE_height="36px"
                        data-testid="t--cancel-reconfigure-api-key"
                        kind="secondary"
                        onClick={() => setShowReconfigureApiKeyModal(false)}
                      >
                        {createMessage(RECONFIGURE_API_KEY_MODAL_CANCEL_BUTTON)}
                      </Button>
                      <Button
                        UNSAFE_height="36px"
                        data-testid="t--confirm-reconfigure-api-key"
                        kind="primary"
                        onClick={confirmReconfigureApiKey}
                      >
                        {createMessage(RECONFIGURE_API_KEY_MODAL_SUBMIT_BUTTON)}
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </>
            )}
          </APIKeyContent>
        </ContentWrapper>
        <BottomSpace />
      </SettingsFormWrapper>
    </Wrapper>
  );
};
