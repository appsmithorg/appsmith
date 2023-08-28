import React, { useEffect, useState } from "react";
import {
  FieldContainer,
  FieldControl,
  FieldQuestion,
  WellContainer,
  WellTitle,
} from "./styles";
import { Callout, Radio, RadioGroup, Text } from "design-system";

interface ChooseGitProviderProps {
  onValidate: (isValid: boolean) => void;
  show: boolean;
}

const NOOP = () => {
  // do nothing
};

function ChooseGitProvider({
  onValidate = NOOP,
  show = true,
}: ChooseGitProviderProps) {
  const [gitProvider, setGitProvider] = useState<string>();
  const [gitEmptyRepoExists, setGitEmptyRepoExists] = useState<string>();

  useEffect(() => {
    if (!!gitProvider && !!gitEmptyRepoExists) {
      onValidate(true);
    } else {
      onValidate(false);
    }
  }, [gitProvider, gitEmptyRepoExists]);

  return (
    <div style={{ display: show ? "block" : "none" }}>
      <WellContainer>
        <WellTitle>
          <Text kind="heading-s">Choose a git provider</Text>
        </WellTitle>
        <FieldContainer>
          <FieldQuestion renderAs="p">
            i. To begin with choose a git provider{" "}
            <Text color="var(--ads-v2-color-red-600)">*</Text>
          </FieldQuestion>
          <FieldControl>
            <RadioGroup
              onChange={(v) => setGitProvider(v)}
              orientation="horizontal"
              value={gitProvider}
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
            style={{ opacity: !gitProvider ? 0.5 : 1 }}
          >
            ii. Do you have an existing empty repository to connect to git?{" "}
            <Text color="var(--ads-v2-color-red-600)">*</Text>
          </FieldQuestion>
          <FieldControl>
            <RadioGroup
              isDisabled={!gitProvider}
              onChange={(v) => setGitEmptyRepoExists(v)}
              orientation="horizontal"
              value={gitEmptyRepoExists}
            >
              <Radio value="yes">Yes</Radio>
              <Radio value="no">No</Radio>
            </RadioGroup>
          </FieldControl>
        </FieldContainer>
      </WellContainer>
      {gitEmptyRepoExists === "no" ? (
        <Callout
          kind="info"
          links={[{ children: "Create new empty repo", to: "/#" }]}
        >
          If you don&apos;t have an empty repository, you need to create one to
          configure git
        </Callout>
      ) : null}
      {gitEmptyRepoExists === "yes" ? (
        <Callout kind="info" links={[{ children: "Import via git", to: "/#" }]}>
          If you choose to use an existing repository, then you should try to
          import the app via git
        </Callout>
      ) : null}
    </div>
  );
}

export default ChooseGitProvider;
