import React, { useEffect, useState } from "react";
import {
  DemoImage,
  ErrorCallout,
  FieldContainer,
  WellContainer,
  WellText,
  WellTitle,
  WellTitleContainer,
} from "./styles";
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Link,
  Option,
  Select,
  Text,
  toast,
} from "design-system";
import styled from "styled-components";
import { CopyButton } from "../../components/CopyButton";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  ADD_DEPLOY_KEY_STEP_TITLE,
  CONSENT_ADDED_DEPLOY_KEY,
  COPY_SSH_KEY,
  ERROR_SSH_KEY_MISCONF_MESSAGE,
  ERROR_SSH_KEY_MISCONF_TITLE,
  HOW_TO_ADD_DEPLOY_KEY,
  READ_DOCS,
  createMessage,
} from "@appsmith/constants/messages";
import { useSSHKeyPair } from "../../hooks";
import type { GitProvider } from "./ChooseGitProvider";
import { GIT_DEMO_GIF } from "./constants";
import noop from "lodash/noop";
import { useSelector } from "react-redux";
import { getIsGitSyncModalOpen } from "selectors/gitSyncSelectors";

export const DeployedKeyContainer = styled.div`
  height: 36px;
  border: 1px solid var(--ads-v2-color-border);
  padding: 8px;
  box-sizing: border-box;
  border-radius: var(--ads-v2-border-radius);
  background-color: #fff;
  align-items: center;
  display: flex;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 3px;
`;

export const KeyType = styled.span`
  font-size: 10px;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg);
  font-weight: 700;
`;

export const KeyText = styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
  font-size: 10px;
  text-transform: uppercase;
  color: var(--ads-v2-color-fg);
  direction: rtl;
  margin-right: 8px;
`;

const StyledSelect = styled(Select)`
  margin-bottom: 4px;
  background-color: white;
  width: initial;

  .rc-select-selector {
    min-width: 100px;
  }

  input {
    width: 100px !important;
  }
`;

const CheckboxTextContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const DummyKey = styled.div`
  height: 36px;

  background: linear-gradient(
    90deg,
    var(--ads-color-black-200) 0%,
    rgba(240, 240, 240, 0) 100%
  );
`;

const getRepositorySettingsUrl = (
  gitProvider?: GitProvider,
  remoteUrl?: string,
) => {
  if (!gitProvider) {
    return "";
  }

  const ownerRepo = remoteUrl?.split(":")?.[1]?.split(".git")?.[0];

  if (!ownerRepo) {
    return "";
  }

  switch (gitProvider) {
    case "github":
      return `https://github.com/${ownerRepo}/settings/keys`;
    case "gitlab":
      return `https://gitlab.com/${ownerRepo}/-/settings/repository`;
    case "bitbucket":
      return `https://bitbucket.org/${ownerRepo}/admin/access-keys/`;
    default:
      return "";
  }
};

interface AddDeployKeyState {
  gitProvider?: GitProvider;
  isAddedDeployKey: boolean;
  remoteUrl: string;
}
interface AddDeployKeyProps {
  onChange: (args: Partial<AddDeployKeyState>) => void;
  value: Partial<AddDeployKeyState>;
  isImport?: boolean;
  errorData?: any;
  connectLoading?: boolean;
}

function AddDeployKey({
  connectLoading = false,
  errorData,
  isImport = false,
  onChange = noop,
  value = {},
}: AddDeployKeyProps) {
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const [fetched, setFetched] = useState(false);
  const [sshKeyType, setSshKeyType] = useState<string>();
  const {
    deployKeyDocUrl,
    fetchingSSHKeyPair,
    fetchSSHKeyPair,
    generateSSHKey,
    generatingSSHKey,
    SSHKeyPair,
  } = useSSHKeyPair();

  useEffect(() => {
    if (isModalOpen && !isImport) {
      if (!fetched) {
        fetchSSHKeyPair({
          onSuccessCallback: () => {
            setFetched(true);
          },
          onErrorCallback: () => {
            setFetched(true);
          },
        });
      }
    } else {
      if (!fetched) {
        setFetched(true);
      }
    }
  }, [isImport, isModalOpen, fetched]);

  useEffect(() => {
    if (isModalOpen && fetched && !fetchingSSHKeyPair) {
      if (SSHKeyPair && SSHKeyPair.includes("rsa")) {
        setSshKeyType("RSA");
      } else if (
        !SSHKeyPair &&
        value?.remoteUrl &&
        value.remoteUrl.toString().toLocaleLowerCase().includes("azure")
      ) {
        setSshKeyType("RSA");
      } else {
        setSshKeyType("ECDSA");
      }
    }
  }, [isModalOpen, fetched, fetchingSSHKeyPair, SSHKeyPair]);

  useEffect(() => {
    if (
      isModalOpen &&
      ((sshKeyType && !SSHKeyPair) ||
        (sshKeyType && !SSHKeyPair?.includes(sshKeyType.toLowerCase())))
    ) {
      generateSSHKey(sshKeyType, {
        onSuccessCallback: () => {
          toast.show("SSH Key generated successfully", { kind: "success" });
        },
      });
    }
  }, [sshKeyType, SSHKeyPair, isModalOpen]);

  const repositorySettingsUrl = getRepositorySettingsUrl(
    value?.gitProvider,
    value?.remoteUrl,
  );

  const loading = fetchingSSHKeyPair || generatingSSHKey;

  return (
    <>
      {errorData &&
        errorData?.responseMeta?.error?.code !== "AE-GIT-4033" &&
        errorData?.responseMeta?.error?.code !== "AE-GIT-4032" && (
          <ErrorCallout kind="error">
            <Text kind="heading-xs" renderAs="h3">
              {errorData?.responseMeta?.error?.errorType}
            </Text>
            <Text renderAs="p">{errorData?.responseMeta?.error?.message}</Text>
          </ErrorCallout>
        )}

      {/* hardcoding message because server doesn't support feature flag. Will change this later */}
      {errorData && errorData?.responseMeta?.error?.code === "AE-GIT-4032" && (
        <ErrorCallout kind="error">
          <Text kind="heading-xs" renderAs="h3">
            {createMessage(ERROR_SSH_KEY_MISCONF_TITLE)}
          </Text>
          <Text renderAs="p">
            {createMessage(ERROR_SSH_KEY_MISCONF_MESSAGE)}
          </Text>
        </ErrorCallout>
      )}

      <WellContainer>
        <WellTitleContainer>
          <WellTitle kind="heading-s" renderAs="h3">
            {createMessage(ADD_DEPLOY_KEY_STEP_TITLE)}
          </WellTitle>
          <Button
            href={
              deployKeyDocUrl ||
              "https://docs.appsmith.com/advanced-concepts/version-control-with-git/connecting-to-git-repository"
            }
            kind="tertiary"
            renderAs="a"
            size="sm"
            startIcon="book-line"
            target="_blank"
          >
            {" "}
            {createMessage(READ_DOCS)}
          </Button>
        </WellTitleContainer>

        <WellText renderAs="p">
          Copy below SSH key and paste it in your{" "}
          {!!repositorySettingsUrl && value.gitProvider !== "others" ? (
            <Link
              rel="noreferrer"
              style={{ display: "inline" }}
              target="_blank"
              to={repositorySettingsUrl}
            >
              repository settings.
            </Link>
          ) : (
            "repository settings."
          )}{" "}
          Now, give write access to it.
        </WellText>
        <FieldContainer>
          <StyledSelect
            onChange={(v) => setSshKeyType(v)}
            size="sm"
            value={sshKeyType}
          >
            <Option value="ECDSA">ECDSA 256</Option>
            <Option value="RSA">RSA 4096</Option>
          </StyledSelect>
          {!loading ? (
            <DeployedKeyContainer>
              <Icon
                color="var(--ads-v2-color-fg)"
                name="key-2-line"
                size="md"
                style={{ marginRight: 4 }}
              />
              <KeyType>{sshKeyType}</KeyType>
              <KeyText>{SSHKeyPair}</KeyText>
              {!connectLoading && (
                <CopyButton
                  onCopy={() => {
                    AnalyticsUtil.logEvent("GS_COPY_SSH_KEY_BUTTON_CLICK");
                  }}
                  tooltipMessage={createMessage(COPY_SSH_KEY)}
                  value={SSHKeyPair}
                />
              )}
            </DeployedKeyContainer>
          ) : (
            <DummyKey />
          )}
        </FieldContainer>
        {value?.gitProvider !== "others" && (
          <Collapsible isOpen>
            <CollapsibleHeader arrowPosition="end">
              <Icon name="play-circle-line" size="md" />
              <Text>{createMessage(HOW_TO_ADD_DEPLOY_KEY)}</Text>
            </CollapsibleHeader>
            <CollapsibleContent>
              <DemoImage
                alt={`Add deploy key in ${value?.gitProvider}`}
                src={GIT_DEMO_GIF.add_deploykey[value?.gitProvider || "github"]}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </WellContainer>
      <Checkbox
        data-testid="t--added-deploy-key-checkbox"
        isSelected={value?.isAddedDeployKey}
        onChange={(v) => onChange({ isAddedDeployKey: v })}
      >
        <CheckboxTextContainer>
          <Text renderAs="p">{createMessage(CONSENT_ADDED_DEPLOY_KEY)}</Text>
          <Text color="var(--ads-v2-color-red-600)" renderAs="p">
            &nbsp;*
          </Text>
        </CheckboxTextContainer>
      </Checkbox>
    </>
  );
}

export default AddDeployKey;
