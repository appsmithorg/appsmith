import React from "react";
import { Title, Caption } from "../components/StyledComponents";
import {
  DEPLOY_YOUR_APPLICATION,
  COMMIT,
  PUSH,
  createMessage,
} from "constants/messages";
import styled from "styled-components";

import NumberedStep from "components/ads/NumberedStep";
import OptionSelector from "../components/OptionSelector";
import { noop } from "lodash";
import TextInput from "components/ads/TextInput";
import Button, { Size } from "components/ads/Button";

const Section = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const NumberedStepContainer = styled.div`
  padding-top: ${(props) => `${props.theme.spaces[3] + 1}px`};
  padding-right: ${(props) => `${props.theme.spaces[11]}px`};
`;

const Gutter = styled.div`
  height: ${(props) => props.theme.spaces[3]}px;
`;

// mock data
const options = [
  { label: "Master", value: "master" },
  { label: "Feature/new-feature", value: "Feature/new-feature" },
];

export default function Commit() {
  return (
    <>
      <Title>{createMessage(DEPLOY_YOUR_APPLICATION)}</Title>
      <Section>
        <NumberedStepContainer>
          <NumberedStep current={1} total={2} />
        </NumberedStepContainer>
        <div>
          <Row>
            <Caption>{createMessage(COMMIT)}&nbsp;</Caption>
            <OptionSelector
              onSelect={noop}
              options={options}
              selected={{
                label: "Feature/new-feature",
                value: "Feature/new-feature",
              }}
            />
          </Row>
          <TextInput defaultValue="Initial Commit" />
          <Gutter />
          <Button
            size={Size.medium}
            text={createMessage(COMMIT)}
            width="max-content"
          />
        </div>
      </Section>
      <Section>
        <NumberedStepContainer>
          <NumberedStep current={2} total={2} />
        </NumberedStepContainer>
        <div>
          <Row>
            <Caption>{createMessage(PUSH)}&nbsp;</Caption>
            <OptionSelector
              onSelect={noop}
              options={options}
              selected={{
                label: "Feature/new-feature",
                value: "Feature/new-feature",
              }}
            />
          </Row>
          <Button
            size={Size.medium}
            text={createMessage(PUSH)}
            width="max-content"
          />
        </div>
      </Section>
    </>
  );
}
