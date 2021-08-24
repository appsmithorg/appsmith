import React from "react";
import { Title, Caption, Space } from "./components/StyledComponents";
import Dropdown from "components/ads/Dropdown";

import {
  createMessage,
  MERGE_CHANGES,
  SELECT_BRANCH_TO_MERGE,
} from "constants/messages";
import { ReactComponent as MergeIcon } from "assets/icons/ads/git-merge.svg";
import { ReactComponent as LeftArrow } from "assets/icons/ads/arrow-left-1.svg";

import styled from "styled-components";
import * as log from "loglevel";
import Button, { Size } from "components/ads/Button";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

// mock
const options = [
  { label: "Master", value: "master" },
  {
    label: "Feature/new",
    value: "Feature/new",
  },
];

export default function Merge() {
  return (
    <>
      <Title>{createMessage(MERGE_CHANGES)}</Title>
      <Caption>{createMessage(SELECT_BRANCH_TO_MERGE)}</Caption>
      <Space size={3} />
      <Row>
        <MergeIcon />
        <Space horizontal size={3} />
        <Dropdown
          onSelect={() => {
            log.debug("selected");
          }}
          options={options}
          selected={{ label: "Master", value: "master" }}
          showLabelOnly
          width={"220px"}
        />
        <Space horizontal size={3} />
        <LeftArrow />
        <Space horizontal size={3} />
        <Dropdown
          onSelect={() => {
            log.debug("selected");
          }}
          options={options}
          selected={{
            label: "Feature/new-feature",
            value: "Feature/new-feature",
          }}
          showLabelOnly
          width={"220px"}
        />
      </Row>
      <Space size={3} />
      <Button
        size={Size.medium}
        text={createMessage(MERGE_CHANGES)}
        width="max-content"
      />
    </>
  );
}
