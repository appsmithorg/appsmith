import React from "react";
import styled from "styled-components";

import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import FormRow from "components/editorComponents/FormRow";
import { PaginationType } from "entities/Action";
import RadioFieldGroup from "components/editorComponents/form/fields/RadioGroupField";
import { Classes, Text, TextType } from "@appsmith/ads-old";
import { Button } from "@appsmith/ads";
import {
  CodeEditorBorder,
  type EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { GifPlayer } from "@appsmith/ads-old";
import thumbnail from "assets/icons/gifs/thumbnail.png";
import configPagination from "assets/icons/gifs/config_pagination.gif";

interface PaginationProps {
  actionName: string;
  onTestClick: (test?: "PREV" | "NEXT") => void;
  paginationType: PaginationType;
  theme?: EditorTheme;
}
const PaginationFieldWrapper = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
  margin-left: ${(props) => props.theme.spaces[11] + 2}px;
  width: 420px;
  button {
    margin-left: ${(props) => props.theme.spaces[5]}px;
  }
`;

const Step = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
  color: var(--ads-v2-color-fg);
  margin-left: ${(props) => props.theme.spaces[11] + 2}px;
`;

const StepTitle = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
  span {
    color: var(--ads-v2-color-fg);
  }
`;

const PaginationTypeView = styled.div`
  margin-left: 28px;
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
  max-width: 100%;
`;

const PaginationSection = styled.div`
  display: flex;
  padding: var(--ads-v2-spaces-4) 0 0 0;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ads-v2-spaces-3);
`;

const Example = styled(Text)`
  display: block;
  margin-left: ${(props) => props.theme.spaces[11] + 2}px;
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
  color: var(--ads-v2-color-fg);
`;

const BindingKey = styled.div`
  padding: ${(props) => props.theme.spaces[1] - 2}px
    ${(props) => props.theme.spaces[1]}px;
  margin-left: ${(props) => props.theme.spaces[11] + 2}px;
  width: fit-content;
  span {
    color: var(--ads-v2-color-fg);
  }
  background: var(--ads-v2-color-bg);
`;

const GifContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  img {
    width: 320px;
    height: 161px;
  }

  .${Classes.TEXT} {
    margin-top: 12px;
  }
`;

export default function Pagination(props: PaginationProps) {
  return (
    <PaginationSection>
      <FormRow>
        <RadioFieldGroup
          className="t--apiFormPaginationType"
          name="actionConfiguration.paginationType"
          options={[
            {
              label: "None",
              value: PaginationType.NONE,
            },
            {
              label: "Paginate with table page number",
              value: PaginationType.PAGE_NO,
            },
            {
              label: "Paginate with response URL",
              value: PaginationType.URL,
            },
          ]}
          placeholder="Method"
          rows={3}
          selectedOptionElements={[
            null,
            <PaginationTypeView key={PaginationType.PAGE_NO}>
              <div>
                <StepTitle>
                  <Text type={TextType.P1}>
                    1. Configure table for pagination
                  </Text>
                </StepTitle>
                <StepTitle>
                  <Text type={TextType.P1}>
                    2. Configure request parameters
                  </Text>
                </StepTitle>
                <Step type={TextType.P1}>
                  1. Map appropriate parameter or header in your request to
                  UsersTable’s page number property
                </Step>
                <Example type={TextType.P2}>
                  Example - Map key <i>pageNo</i> or similar to value
                </Example>
                <BindingKey>
                  <Text type={TextType.P2}>{"{{UsersTable.pageNo}}"}</Text>
                </BindingKey>
              </div>
            </PaginationTypeView>,
            <PaginationTypeView key={PaginationType.URL}>
              <div>
                <StepTitle>
                  <Text type={TextType.P1}>
                    1. Configure table for pagination
                  </Text>
                </StepTitle>
                <StepTitle>
                  <Text type={TextType.P1}>
                    2. Configure Request Parameters
                  </Text>
                </StepTitle>
                <Step type={TextType.P1}>Configure next and previous URL </Step>
                <Step type={TextType.P1}>Previous URL</Step>
                <PaginationFieldWrapper
                  data-location-id={btoa("actionConfiguration.prev")}
                >
                  <DynamicTextField
                    border={CodeEditorBorder.ALL_SIDE}
                    className="t--apiFormPaginationPrev"
                    evaluatedPopUpLabel="Previous URL"
                    fill={!!true}
                    focusElementName={`${props.actionName}.actionConfiguration.prev`}
                    height="100%"
                    name="actionConfiguration.prev"
                    theme={props.theme}
                  />
                  <Button
                    className="t--apiFormPaginationPrevTest"
                    kind="secondary"
                    onClick={() => {
                      props.onTestClick("PREV");
                    }}
                    size="md"
                  >
                    Test
                  </Button>
                </PaginationFieldWrapper>
                <Step type={TextType.P1}>Next URL</Step>
                <PaginationFieldWrapper
                  data-location-id={btoa("actionConfiguration.next")}
                >
                  <DynamicTextField
                    border={CodeEditorBorder.ALL_SIDE}
                    className="t--apiFormPaginationNext"
                    evaluatedPopUpLabel="Next URL"
                    fill={!!true}
                    focusElementName={`${props.actionName}.actionConfiguration.next`}
                    height="100%"
                    name="actionConfiguration.next"
                    theme={props.theme}
                  />
                  <Button
                    className="t--apiFormPaginationNextTest"
                    kind="secondary"
                    onClick={() => {
                      props.onTestClick("NEXT");
                    }}
                    size="md"
                  >
                    Test
                  </Button>
                </PaginationFieldWrapper>
              </div>
            </PaginationTypeView>,
          ]}
        />
      </FormRow>
      {props.paginationType !== PaginationType.NONE ? (
        <GifContainer>
          <GifPlayer gif={configPagination} thumbnail={thumbnail} />
          <Text type={TextType.P3}>Configure table for pagination</Text>
        </GifContainer>
      ) : null}
    </PaginationSection>
  );
}
