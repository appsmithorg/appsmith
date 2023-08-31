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
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Radio,
  RadioGroup,
  Text,
} from "design-system";
import styled from "styled-components";

const WellInnerContainer = styled.div`
  padding-left: 16px;
`;

interface ChooseGitProviderState {
  gitProvider: string;
  gitEmptyRepoExists: string;
}
interface ChooseGitProviderProps {
  onChange: (args: Partial<ChooseGitProviderState>) => void;
  value: Partial<ChooseGitProviderState>;
}

const NOOP = () => {
  // do nothing
};

function ChooseGitProvider({
  onChange = NOOP,
  value = {},
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
                onChange={(v) => onChange({ gitProvider: v })}
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
          {value?.gitEmptyRepoExists === "no" ? (
            <Collapsible isOpen>
              <CollapsibleHeader arrowPosition="end">
                <Icon name="play-circle-line" size="md" />
                <Text>How to create a new repository?</Text>
              </CollapsibleHeader>
              <CollapsibleContent>
                <DemoImage
                  alt="Copy and paste remote url from Github"
                  src="https://placehold.co/600x300"
                />
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </WellInnerContainer>
      </WellContainer>
      {value?.gitEmptyRepoExists === "no" ? (
        <Callout kind="info" links={[{ children: "Import via git", to: "/#" }]}>
          If you choose to use an existing repository, then you should try to
          import the app via git
        </Callout>
      ) : null}
    </div>
  );
}

export default ChooseGitProvider;
