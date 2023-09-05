import React from "react";
import {
  DemoImage,
  FieldContainer,
  FieldControl,
  FieldQuestion,
  WellContainer,
  WellTitle,
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
} from "design-system";
import styled from "styled-components";
import { GIT_DEMO_GIF } from "./constants";

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

const NOOP = () => {
  // do nothing
};

function ChooseGitProvider({
  onChange = NOOP,
  value = {},
  isImport = false,
}: ChooseGitProviderProps) {
  return (
    <div>
      <WellContainer>
        <WellTitle>
          <Text kind="heading-s">Choose a git provider</Text>
        </WellTitle>
        <WellInnerContainer>
          <FieldContainer>
            <FieldQuestion renderAs="p">
              i. To begin with choose a git provider{" "}
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
                <Radio value="github">Github</Radio>
                <Radio value="gitlab">Gitlab</Radio>
                <Radio value="bitbucket">Bitbucket</Radio>
                <Radio value="others">Others</Radio>
              </RadioGroup>
            </FieldControl>
          </FieldContainer>
          {!isImport && (
            <FieldContainer>
              <FieldQuestion
                renderAs="p"
                style={{ opacity: !value?.gitProvider ? 0.5 : 1 }}
              >
                ii. Do you have an existing empty repository to connect to git?{" "}
                <Text color="var(--ads-v2-color-red-600)">*</Text>
              </FieldQuestion>
              <FieldControl>
                <RadioGroup
                  isDisabled={!value?.gitProvider}
                  onChange={(v) => onChange({ gitEmptyRepoExists: v })}
                  orientation="horizontal"
                  value={value?.gitEmptyRepoExists}
                >
                  <Radio value="yes">Yes</Radio>
                  <Radio value="no">No</Radio>
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
                  <Text>How to create a new repository?</Text>
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
        </WellInnerContainer>
      </WellContainer>
      {!isImport && value?.gitEmptyRepoExists === "no" ? (
        <Callout kind="info" links={[{ children: "Import via git", to: "/#" }]}>
          If you choose to use an existing repository, then you should try to
          import the app via git
        </Callout>
      ) : null}
      {isImport && (
        <Checkbox
          isSelected={value?.gitExistingRepoExists}
          onChange={(v) => onChange({ gitExistingRepoExists: v })}
        >
          <CheckboxTextContainer>
            <Text renderAs="p">
              I have an existing appsmith app connected to git
            </Text>
            <Text color="var(--ads-v2-color-red-600)" renderAs="p">
              &nbsp;*
            </Text>
          </CheckboxTextContainer>
        </Checkbox>
      )}
    </div>
  );
}

export default ChooseGitProvider;
