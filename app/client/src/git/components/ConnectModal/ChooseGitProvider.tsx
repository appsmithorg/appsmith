import React, { useCallback, useMemo } from "react";
import {
  DemoImage,
  FieldContainer,
  FieldControl,
  FieldQuestion,
  WellContainer,
  WellTitle,
  WellTitleContainer,
} from "./common";
import {
  Callout,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Radio,
  RadioGroup,
  Text,
} from "@appsmith/ads";
import styled from "styled-components";
import { GIT_DEMO_GIF } from "./constants";
import noop from "lodash/noop";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import {
  CHOOSE_A_GIT_PROVIDER_STEP,
  CHOOSE_GIT_PROVIDER_QUESTION,
  HOW_TO_CREATE_EMPTY_REPO,
  IMPORT_ARTIFACT_IF_NOT_EMPTY,
  IS_EMPTY_REPO_QUESTION,
  I_HAVE_EXISTING_ARTIFACT_REPO,
  NEED_EMPTY_REPO_MESSAGE,
  createMessage,
} from "ee/constants/messages";

const WellInnerContainer = styled.div`
  padding-left: 16px;
`;

const CheckboxTextContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const GIT_PROVIDERS = ["github", "gitlab", "bitbucket", "others"] as const;

export type GitProvider = (typeof GIT_PROVIDERS)[number];

interface ChooseGitProviderState {
  gitProvider?: GitProvider;
  gitEmptyRepoExists: string;
  gitExistingRepoExists: boolean;
}
interface ChooseGitProviderProps {
  artifactId: string;
  artifactType: string;
  onChange: (args: Partial<ChooseGitProviderState>) => void;
  value: Partial<ChooseGitProviderState>;
  isImport?: boolean;
  // Replaces handleImport in original ChooseGitProvider.tsx
  onImportFromCalloutLinkClick: () => void;
  // Replaces hasCreateNewApplicationPermission = hasCreateNewAppPermission(workspace.userPermissions)
  canCreateNewArtifact: boolean;
}

function ChooseGitProvider({
  artifactType,
  canCreateNewArtifact,
  isImport = false,
  onChange = noop,
  onImportFromCalloutLinkClick,
  value = {},
}: ChooseGitProviderProps) {
  const isMobile = useIsMobileDevice();

  const hasCreateNewArtifactPermission = canCreateNewArtifact && !isMobile;

  const onGitProviderChange = useCallback(
    (value: string) => {
      const gitProvider = value as GitProvider;

      if (GIT_PROVIDERS.includes(gitProvider)) {
        onChange({ gitProvider });
      }
    },
    [onChange],
  );

  const onEmptyRepoOptionChange = useCallback(
    (gitEmptyRepoExists) => onChange({ gitEmptyRepoExists }),
    [onChange],
  );

  const onExistingRepoOptionChange = useCallback(
    (gitExistingRepoExists) => onChange({ gitExistingRepoExists }),
    [onChange],
  );

  const importCalloutLinks = useMemo(() => {
    return hasCreateNewArtifactPermission
      ? [{ children: "Import via git", onClick: onImportFromCalloutLinkClick }]
      : [];
  }, [hasCreateNewArtifactPermission, onImportFromCalloutLinkClick]);

  return (
    <>
      <WellContainer>
        <WellTitleContainer>
          <WellTitle kind="heading-s" renderAs="h3">
            {createMessage(CHOOSE_A_GIT_PROVIDER_STEP)}
          </WellTitle>
        </WellTitleContainer>
        <WellInnerContainer>
          <FieldContainer>
            <FieldQuestion renderAs="p">
              i. {createMessage(CHOOSE_GIT_PROVIDER_QUESTION)}{" "}
              <Text color="var(--ads-v2-color-red-600)">*</Text>
            </FieldQuestion>
            <FieldControl>
              <RadioGroup
                onChange={onGitProviderChange}
                orientation="horizontal"
                value={value?.gitProvider}
              >
                <Radio
                  data-testid="t--git-provider-radio-github"
                  value="github"
                >
                  Github
                </Radio>
                <Radio
                  data-testid="t--git-provider-radio-gitlab"
                  value="gitlab"
                >
                  Gitlab
                </Radio>
                <Radio
                  data-testid="t--git-provider-radio-bitbucket"
                  value="bitbucket"
                >
                  Bitbucket
                </Radio>
                <Radio
                  data-testid="t--git-provider-radio-others"
                  value="others"
                >
                  Others
                </Radio>
              </RadioGroup>
            </FieldControl>
          </FieldContainer>
          {!isImport && (
            <FieldContainer>
              <FieldQuestion isDisabled={!value?.gitProvider} renderAs="p">
                ii. {createMessage(IS_EMPTY_REPO_QUESTION)}{" "}
                <Text color="var(--ads-v2-color-red-600)">*</Text>
              </FieldQuestion>
              <FieldControl>
                <RadioGroup
                  isDisabled={!value?.gitProvider}
                  onChange={onEmptyRepoOptionChange}
                  orientation="horizontal"
                  value={value?.gitEmptyRepoExists}
                >
                  <Radio data-testid="t--existing-empty-repo-yes" value="yes">
                    Yes
                  </Radio>
                  <Radio data-testid="t--existing-empty-repo-no" value="no">
                    No
                  </Radio>
                </RadioGroup>
              </FieldControl>
            </FieldContainer>
          )}
          {!isImport &&
            value?.gitProvider !== "others" &&
            value?.gitEmptyRepoExists === "no" && (
              <Collapsible isOpen>
                <CollapsibleHeader arrowPosition="end">
                  <Icon name="play-circle-line" size="md" />
                  <Text>{createMessage(HOW_TO_CREATE_EMPTY_REPO)}</Text>
                </CollapsibleHeader>
                <CollapsibleContent>
                  <DemoImage
                    alt={`Create an empty repo in ${value?.gitProvider}`}
                    src={
                      GIT_DEMO_GIF.create_repo[value?.gitProvider || "github"]
                    }
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          {!isImport &&
            value?.gitProvider === "others" &&
            value?.gitEmptyRepoExists === "no" && (
              <Callout kind="warning">
                {createMessage(NEED_EMPTY_REPO_MESSAGE)}
              </Callout>
            )}
        </WellInnerContainer>
      </WellContainer>
      {!isImport && value?.gitEmptyRepoExists === "no" ? (
        <Callout kind="info" links={importCalloutLinks}>
          {createMessage(IMPORT_ARTIFACT_IF_NOT_EMPTY, artifactType)}
        </Callout>
      ) : null}
      {isImport && (
        <Checkbox
          data-testid="t--existing-repo-checkbox"
          isSelected={value?.gitExistingRepoExists}
          onChange={onExistingRepoOptionChange}
        >
          <CheckboxTextContainer>
            <Text renderAs="p">
              {createMessage(I_HAVE_EXISTING_ARTIFACT_REPO, artifactType)}
            </Text>
            <Text color="var(--ads-v2-color-red-600)" renderAs="p">
              &nbsp;*
            </Text>
          </CheckboxTextContainer>
        </Checkbox>
      )}
    </>
  );
}

export default ChooseGitProvider;
