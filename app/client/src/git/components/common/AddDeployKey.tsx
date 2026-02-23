import React, { useCallback, useEffect, useState } from "react";
import {
  DemoImage,
  ErrorCallout,
  FieldContainer,
  WellContainer,
  WellText,
  WellTitle,
  WellTitleContainer,
} from "./GitUIComponents";
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Flex,
  Icon,
  Link,
  Option,
  Radio,
  RadioGroup,
  Select,
  Text,
} from "@appsmith/ads";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  ADD_DEPLOY_KEY_STEP_TITLE,
  CONSENT_ADDED_DEPLOY_KEY,
  COPY_SSH_KEY,
  ERROR_SSH_KEY_MISCONF_MESSAGE,
  ERROR_SSH_KEY_MISCONF_TITLE,
  HOW_TO_ADD_DEPLOY_KEY,
  READ_DOCS,
  createMessage,
} from "ee/constants/messages";
import { ARTIFACT_SSH_KEY_MANAGER } from "git/ee/constants/messages";
import { GIT_DEMO_GIF } from "./constants";
import noop from "lodash/noop";
import CopyButton from "./CopyButton";
import type { GitApiError } from "git/store/types";
import type {
  ConnectFormDataState,
  GitProvider,
  SSHKeyOption,
  SSHKeySource,
} from "./types";

const StyledSelect = styled(Select)`
  background-color: white;
  width: initial;

  .rc-select-selector {
    min-width: 100px;
  }

  input {
    width: 100px !important;
  }
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

const DEPLOY_DOCS_URL =
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git/connecting-to-git-repository";

export interface AddDeployKeyProps {
  error: GitApiError | null;
  isSubmitLoading: boolean;
  isSSHKeyLoading: boolean;
  onChange: (args: Partial<ConnectFormDataState>) => void;
  onFetchSSHKey?: () => void;
  onGenerateSSHKey: (keyType: string) => void;
  sshPublicKey: string | null;
  value: Partial<ConnectFormDataState> | null;
  /**
   * Whether the SSH key manager feature is enabled
   */
  isSSHKeyManagerEnabled?: boolean;
  /**
   * List of available SSH keys from the SSH key manager
   */
  availableSSHKeys?: SSHKeyOption[];
  /**
   * Whether the SSH keys list is loading
   */
  isSSHKeysLoading?: boolean;
  /**
   * Current user's email (to determine key ownership)
   */
  currentUserEmail?: string;
  /**
   * Callback to fetch SSH keys (called only when user chooses "Use existing key")
   */
  onFetchSSHKeys?: () => void;
  /**
   * Callback to navigate to SSH key creation (shown when no keys exist)
   */
  onCreateSSHKey?: () => void;
}

function AddDeployKey({
  availableSSHKeys = [],
  currentUserEmail,
  error = null,
  isSSHKeyLoading = false,
  isSSHKeyManagerEnabled = false,
  isSSHKeysLoading = false,
  isSubmitLoading = false,
  onChange = noop,
  onCreateSSHKey = noop,
  onFetchSSHKey = noop,
  onFetchSSHKeys = noop,
  onGenerateSSHKey = noop,
  sshPublicKey = null,
  value = null,
}: AddDeployKeyProps) {
  const [fetched, setFetched] = useState(false);
  const [keyType, setKeyType] = useState<string>();

  const sshKeySource: SSHKeySource = value?.sshKeySource || "generate";
  const selectedSSHKeyId = value?.sshKeyId;

  // Get the selected SSH key's public key for display
  const selectedSSHKey = availableSSHKeys.find(
    (key) => key.id === selectedSSHKeyId,
  );
  const displayPublicKey =
    sshKeySource === "existing"
      ? selectedSSHKey?.gitAuth.publicKey ?? null
      : sshPublicKey;

  useEffect(
    function fetchKeyPairOnInitEffect() {
      // Only fetch deploy key if using "generate" mode
      if (!fetched && sshKeySource === "generate") {
        onFetchSSHKey();
        setFetched(true);
      }
    },
    [fetched, onFetchSSHKey, sshKeySource],
  );

  useEffect(
    function setSSHKeyTypeonInitEffect() {
      // Only set key type for "generate" mode
      if (sshKeySource === "generate" && fetched && !isSSHKeyLoading) {
        if (sshPublicKey && sshPublicKey.includes("rsa")) {
          setKeyType("RSA");
        } else if (
          !sshPublicKey &&
          value?.remoteUrl &&
          value.remoteUrl.toString().toLocaleLowerCase().includes("azure")
        ) {
          setKeyType("RSA");
        } else {
          setKeyType("ECDSA");
        }
      }
    },
    [fetched, sshPublicKey, value?.remoteUrl, isSSHKeyLoading, sshKeySource],
  );

  useEffect(
    function generateSSHOnInitEffect() {
      // Only generate for "generate" mode
      if (
        sshKeySource === "generate" &&
        ((keyType && !sshPublicKey) ||
          (keyType && !sshPublicKey?.includes(keyType.toLowerCase())))
      ) {
        onGenerateSSHKey(keyType);
      }
    },
    [keyType, sshPublicKey, onGenerateSSHKey, sshKeySource],
  );

  const handleSSHKeySourceChange = useCallback(
    (newSource: string) => {
      const source = newSource as SSHKeySource;

      onChange({
        sshKeySource: source,
        // Clear sshKeyId when switching to generate
        sshKeyId: source === "generate" ? undefined : value?.sshKeyId,
        // Reset the deploy key confirmation when switching
        isAddedDeployKey: false,
      });

      // If switching to generate mode and haven't fetched yet, trigger fetch for deploy key
      if (source === "generate" && !fetched) {
        onFetchSSHKey();
        setFetched(true);
      }

      // If switching to existing mode, fetch SSH keys from the manager
      if (source === "existing") {
        onFetchSSHKeys();
      }
    },
    [onChange, value?.sshKeyId, fetched, onFetchSSHKey, onFetchSSHKeys],
  );

  const handleSSHKeySelect = useCallback(
    (keyId: string) => {
      onChange({
        sshKeyId: keyId,
        // Reset the deploy key confirmation when changing key
        isAddedDeployKey: false,
      });
    },
    [onChange],
  );

  const repositorySettingsUrl = getRepositorySettingsUrl(
    value?.gitProvider,
    value?.remoteUrl,
  );

  // const loading = isFetchSSHKeyLoading || isGenerateSSHKeyLoading;

  const onCopy = useCallback(() => {
    AnalyticsUtil.logEvent("GS_COPY_SSH_KEY_BUTTON_CLICK");
  }, []);

  const handleAddedKeyCheck = useCallback(
    (isAddedDeployKey: boolean) => {
      onChange({ isAddedDeployKey });
    },
    [onChange],
  );

  const renderRepositorySettings = () => {
    if (!!repositorySettingsUrl && value?.gitProvider !== "others") {
      return (
        <Link
          rel="noreferrer"
          style={{ display: "inline" }}
          target="_blank"
          to={repositorySettingsUrl}
        >
          repository settings.
        </Link>
      );
    }

    return "repository settings.";
  };

  return (
    <>
      {error &&
        error.code !== "AE-GIT-4033" &&
        error.code !== "AE-GIT-4032" && (
          <ErrorCallout kind="error">
            <Text kind="heading-xs" renderAs="h3">
              {error.errorType}
            </Text>
            <Text renderAs="p">{error.message}</Text>
          </ErrorCallout>
        )}

      {/* hardcoding message because server doesn't support feature flag. Will change this later */}
      {error && error.code === "AE-GIT-4032" && (
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
            href={DEPLOY_DOCS_URL}
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

        <Flex flexDirection="column" gap="spaces-4">
          {/* SSH Key Source Selection - only show when SSH key manager is enabled */}
          {isSSHKeyManagerEnabled && (
            <RadioGroup
              isDisabled={isSubmitLoading}
              onChange={handleSSHKeySourceChange}
              value={sshKeySource}
            >
              <Radio value="existing">Use existing SSH key</Radio>
              <Radio value="generate">Generate new deploy key</Radio>
            </RadioGroup>
          )}

          {/* Existing SSH Key Selection */}
          {isSSHKeyManagerEnabled &&
            sshKeySource === "existing" &&
            (availableSSHKeys.length > 0 ? (
              <Flex flexDirection="column" gap="spaces-2">
                <Text renderAs="label">Select SSH Key</Text>
                <Select
                  dropdownStyle={{ maxHeight: 200, overflow: "auto" }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  isDisabled={isSubmitLoading}
                  isLoading={isSSHKeysLoading}
                  listHeight={200}
                  onChange={handleSSHKeySelect}
                  placeholder="Search or select an SSH key"
                  showSearch
                  size="md"
                  value={selectedSSHKeyId}
                  virtual={false}
                >
                  {availableSSHKeys.map((key) => (
                    <Option key={key.id} value={key.id}>
                      <Flex alignItems="center" gap="spaces-2">
                        <Text kind="body-s" renderAs="span">
                          {key.name}
                        </Text>
                        <Text
                          color="var(--ads-v2-color-fg-muted)"
                          kind="body-s"
                          renderAs="span"
                        >
                          {key.email === currentUserEmail
                            ? "(owned)"
                            : `(shared by ${key.email})`}
                        </Text>
                      </Flex>
                    </Option>
                  ))}
                </Select>
              </Flex>
            ) : (
              !isSSHKeysLoading && (
                <Flex
                  alignItems="center"
                  background="var(--ads-v2-color-bg-subtle)"
                  border="1px dashed var(--ads-v2-color-border)"
                  borderRadius="var(--ads-v2-border-radius)"
                  flexDirection="column"
                  justifyContent="center"
                  padding="spaces-7"
                >
                  <Flex
                    alignItems="center"
                    flexDirection="column"
                    gap="spaces-2"
                  >
                    <Icon
                      color="var(--ads-v2-color-fg-muted)"
                      name="key-2-line"
                      size="lg"
                    />
                    <Text kind="heading-xs" renderAs="h4">
                      {ARTIFACT_SSH_KEY_MANAGER.NO_KEYS_TITLE}
                    </Text>
                    <Text
                      color="var(--ads-v2-color-fg-muted)"
                      renderAs="p"
                      style={{ maxWidth: 300 }}
                    >
                      {ARTIFACT_SSH_KEY_MANAGER.NO_KEYS_DESCRIPTION}
                    </Text>
                    <Button
                      kind="secondary"
                      onClick={onCreateSSHKey}
                      size="sm"
                      startIcon="add-line"
                    >
                      {ARTIFACT_SSH_KEY_MANAGER.CREATE_KEY_CTA}
                    </Button>
                  </Flex>
                </Flex>
              )
            ))}

          {(sshKeySource === "generate" || displayPublicKey) && (
            <>
              <WellText renderAs="p">
                Copy below SSH key and paste it in your{" "}
                {renderRepositorySettings()} Now, give write access to it.
              </WellText>
              <FieldContainer>
                <Flex flexDirection="column" gap="spaces-1">
                  {sshKeySource === "generate" && (
                    <StyledSelect
                      getPopupContainer={(triggerNode) =>
                        triggerNode.parentNode
                      }
                      isDisabled={isSubmitLoading}
                      onChange={setKeyType}
                      size="sm"
                      value={keyType}
                    >
                      <Option value="ECDSA">ECDSA 256</Option>
                      <Option value="RSA">RSA 4096</Option>
                    </StyledSelect>
                  )}
                  {!(sshKeySource === "generate"
                    ? isSSHKeyLoading
                    : isSSHKeysLoading) ? (
                    <Flex
                      alignItems="center"
                      background="var(--ads-v2-color-bg)"
                      border="1px solid var(--ads-v2-color-border)"
                      borderRadius="var(--ads-v2-border-radius)"
                      height="36px"
                      padding="spaces-3"
                    >
                      <Flex
                        alignItems="center"
                        flex="1"
                        gap="spaces-2"
                        minWidth="0"
                      >
                        <Icon
                          color="var(--ads-v2-color-fg)"
                          name="key-2-line"
                          size="md"
                        />
                        <Text
                          isBold
                          kind="action-s"
                          renderAs="span"
                          style={{ textTransform: "uppercase" }}
                        >
                          {sshKeySource === "existing"
                            ? selectedSSHKey?.keyType
                            : keyType}
                        </Text>
                        <Text
                          kind="action-s"
                          renderAs="span"
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            direction: "rtl",
                          }}
                        >
                          {displayPublicKey}
                        </Text>
                        {!isSubmitLoading && (
                          <CopyButton
                            onCopy={onCopy}
                            tooltipMessage={createMessage(COPY_SSH_KEY)}
                            value={displayPublicKey ?? ""}
                          />
                        )}
                      </Flex>
                    </Flex>
                  ) : (
                    <Flex
                      background="linear-gradient(90deg, var(--ads-color-black-200) 0%, rgba(240, 240, 240, 0) 100%)"
                      height="36px"
                    />
                  )}
                </Flex>
              </FieldContainer>
            </>
          )}
          {value?.gitProvider !== "others" && sshKeySource === "generate" && (
            <Collapsible isOpen>
              <CollapsibleHeader arrowPosition="end">
                <Icon name="play-circle-line" size="md" />
                <Text>{createMessage(HOW_TO_ADD_DEPLOY_KEY)}</Text>
              </CollapsibleHeader>
              <CollapsibleContent>
                <DemoImage
                  alt={`Add deploy key in ${value?.gitProvider}`}
                  src={
                    GIT_DEMO_GIF.add_deploykey[value?.gitProvider || "github"]
                  }
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </Flex>
      </WellContainer>
      <Checkbox
        data-testid="t--git-connect-deploy-key-checkbox"
        isSelected={value?.isAddedDeployKey}
        onChange={handleAddedKeyCheck}
      >
        <Flex alignItems="center" gap="spaces-1">
          <Text renderAs="p">{createMessage(CONSENT_ADDED_DEPLOY_KEY)}</Text>
          <Text color="var(--ads-v2-color-red-600)" renderAs="p">
            *
          </Text>
        </Flex>
      </Checkbox>
    </>
  );
}

export default AddDeployKey;
