import React from "react";
import {
  DemoImage,
  FieldContainer,
  FieldControl,
  FieldQuestion,
  WellContainer,
  WellTitle,
  WellTitleContainer,
} from "./styles";
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
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { setWorkspaceIdForImport } from "ee/actions/applicationActions";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import history from "utils/history";
import noop from "lodash/noop";
import { hasCreateNewAppPermission } from "ee/utils/permissionHelpers";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import {
  CHOOSE_A_GIT_PROVIDER_STEP,
  CHOOSE_GIT_PROVIDER_QUESTION,
  HOW_TO_CREATE_EMPTY_REPO,
  IMPORT_APP_IF_NOT_EMPTY,
  IS_EMPTY_REPO_QUESTION,
  I_HAVE_EXISTING_REPO,
  NEED_EMPTY_REPO_MESSAGE,
  createMessage,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const WellInnerContainer = styled.div`
  padding-left: 16px;
`;

const CheckboxTextContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`;

export type GitProvider = "github" | "gitlab" | "bitbucket" | "others";

interface ChooseGitProviderState {
  gitProvider?: GitProvider;
  gitEmptyRepoExists: string;
  gitExistingRepoExists: boolean;
}
interface ChooseGitProviderProps {
  onChange: (args: Partial<ChooseGitProviderState>) => void;
  value: Partial<ChooseGitProviderState>;
  isImport?: boolean;
}

function ChooseGitProvider({
  isImport = false,
  onChange = noop,
  value = {},
}: ChooseGitProviderProps) {
  const appId = useSelector(getCurrentApplicationId);
  const workspace = useSelector(getCurrentAppWorkspace);
  const isMobile = useIsMobileDevice();

  const dispatch = useDispatch();
  const handleImport = () => {
    history.push("/applications");

    dispatch({
      type: ReduxActionTypes.GIT_INFO_INIT,
    });
    dispatch(
      setWorkspaceIdForImport({
        editorId: appId || "",
        workspaceId: workspace.id,
      }),
    );

    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.GIT_CONNECTION,
      }),
    );
    AnalyticsUtil.logEvent("GS_IMPORT_VIA_GIT_DURING_GC");
  };

  const hasCreateNewApplicationPermission =
    hasCreateNewAppPermission(workspace.userPermissions) && !isMobile;

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
                onChange={(v) => {
                  if (
                    v === "github" ||
                    v === "gitlab" ||
                    v === "bitbucket" ||
                    v === "others"
                  ) {
                    onChange({ gitProvider: v });
                  }
                }}
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
              <FieldQuestion
                renderAs="p"
                style={{ opacity: !value?.gitProvider ? 0.5 : 1 }}
              >
                ii. {createMessage(IS_EMPTY_REPO_QUESTION)}{" "}
                <Text color="var(--ads-v2-color-red-600)">*</Text>
              </FieldQuestion>
              <FieldControl>
                <RadioGroup
                  isDisabled={!value?.gitProvider}
                  onChange={(v) => onChange({ gitEmptyRepoExists: v })}
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
                    alt={`Create an empty repo in ${value?.gitProvider}}`}
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
        <Callout
          kind="info"
          links={
            hasCreateNewApplicationPermission
              ? [{ children: "Import via git", onClick: handleImport }]
              : []
          }
        >
          {createMessage(IMPORT_APP_IF_NOT_EMPTY)}
        </Callout>
      ) : null}
      {isImport && (
        <Checkbox
          data-testid="t--existing-repo-checkbox"
          isSelected={value?.gitExistingRepoExists}
          onChange={(v) => onChange({ gitExistingRepoExists: v })}
        >
          <CheckboxTextContainer>
            <Text renderAs="p">{createMessage(I_HAVE_EXISTING_REPO)}</Text>
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
