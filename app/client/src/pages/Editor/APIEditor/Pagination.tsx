import React from "react";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";

import styled from "constants/DefaultTheme";
import FormRow from "components/editorComponents/FormRow";
import { PaginationType } from "entities/Action";
import RadioFieldGroup from "components/editorComponents/form/fields/RadioGroupField";
import Text, { Case, TextType } from "components/ads/Text";
import Button, { Category, Size } from "components/ads/Button";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import GifPlayerComponent from "components/ads/GifPlayerComponent";
import { Classes } from "components/ads/common";
import lightmodeGif from "assets/icons/gifs/config_pagination_lightmode.gif";
import darkmodeGif from "assets/icons/gifs/config_pagination_darkmode.gif";

interface PaginationProps {
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

const Description = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[6]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.description};
`;

const Step = styled(Text)`
  display: block;
  margin-bottom: ${(props) => props.theme.spaces[5]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.label};
  margin-left: ${(props) => props.theme.spaces[11] + 2}px;
`;

const StepTitle = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
  span {
    color: ${(props) => props.theme.colors.apiPane.pagination.stepTitle};
  }
`;

const NumberBox = styled.div`
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) =>
    props.theme.colors.apiPane.pagination.numberBg};
  color: ${(props) => props.theme.colors.apiPane.pagination.numberColor};
  margin-right: 8px;
`;

const PaginationTypeView = styled.div`
  margin-left: 330px;
  width: 100%;
  display: flex;
  justify-content: space-between;
`;

const PaginationSection = styled.div`
  display: flex;
  padding: ${(props) => props.theme.spaces[8]}px
    ${(props) => props.theme.spaces[12]}px;
`;

const Example = styled(Text)`
  display: block;
  margin-left: ${(props) => props.theme.spaces[11] + 2}px;
  margin-bottom: ${(props) => props.theme.spaces[3]}px;
  color: ${(props) => props.theme.colors.apiPane.pagination.label};
`;

const BindingKey = styled.div`
  padding: ${(props) => props.theme.spaces[1] - 2}px
    ${(props) => props.theme.spaces[1]}px;
  margin-left: ${(props) => props.theme.spaces[11] + 2}px;
  width: fit-content;
  span {
    color: ${(props) => props.theme.colors.apiPane.pagination.label};
  }
  background: ${(props) => props.theme.colors.apiPane.pagination.bindingBg};
`;

const GifContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

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
      <FormRow
        style={{
          position: "fixed",
        }}
      >
        <RadioFieldGroup
          placeholder="Method"
          name="actionConfiguration.paginationType"
          className="t--apiFormPaginationType"
          rows={3}
          options={[
            {
              label: "None",
              value: PaginationType.NONE,
            },
            {
              label: "Paginate with Table Page No",
              value: PaginationType.PAGE_NO,
            },
            {
              label: "Paginate with Response Url",
              value: PaginationType.URL,
            },
          ]}
        />
      </FormRow>

      {props.paginationType === PaginationType.URL && (
        <PaginationTypeView>
          <div>
            <Description type={TextType.H6} case={Case.UPPERCASE}>
              Pagination with response url
            </Description>
            <StepTitle>
              <NumberBox>1</NumberBox>
              <Text type={TextType.P1}>Configure Table for Pagination</Text>
            </StepTitle>
            <Step type={TextType.P1}>1. Enable server side pagination</Step>
            <Step type={TextType.P1}>2. Configure OnPageChange action</Step>
            <StepTitle>
              <NumberBox>2</NumberBox>
              <Text type={TextType.P1}>Configure Request Parameters</Text>
            </StepTitle>
            <Step type={TextType.P1}>Configure Next and Previous URL </Step>
            <Step type={TextType.P1}>Previous url</Step>
            <PaginationFieldWrapper>
              <DynamicTextField
                className="t--apiFormPaginationPrev"
                name="actionConfiguration.prev"
                theme={props.theme}
                fill
              />
              <Button
                className="t--apiFormPaginationPrevTest"
                category={Category.tertiary}
                onClick={() => {
                  props.onTestClick("PREV");
                }}
                text={"Test"}
                size={Size.medium}
                tag="button"
              />
            </PaginationFieldWrapper>
            <Step type={TextType.P1}>Next url</Step>
            <PaginationFieldWrapper>
              <DynamicTextField
                className="t--apiFormPaginationNext"
                name="actionConfiguration.next"
                theme={props.theme}
                fill
              />
              <Button
                className="t--apiFormPaginationNextTest"
                category={Category.tertiary}
                onClick={() => {
                  props.onTestClick("NEXT");
                }}
                text={"Test"}
                size={Size.medium}
                tag="button"
              />
            </PaginationFieldWrapper>
          </div>
          <GifContainer>
            <GifPlayerComponent
              gif={
                props.theme === EditorTheme.LIGHT ? lightmodeGif : darkmodeGif
              }
            />
            <Text type={TextType.P3}>
              1. How to Configure Table for Pagination
            </Text>
          </GifContainer>
        </PaginationTypeView>
      )}
      {props.paginationType === PaginationType.PAGE_NO && (
        <PaginationTypeView>
          <div>
            <Description type={TextType.H6} case={Case.UPPERCASE}>
              Pagination with Table Page number
            </Description>
            <StepTitle>
              <NumberBox>1</NumberBox>
              <Text type={TextType.P1}>Configure Table for Pagination</Text>
            </StepTitle>
            <Step type={TextType.P1}>1. Enable server side pagination</Step>
            <Step type={TextType.P1}>2. Configure OnPageChange action</Step>
            <StepTitle>
              <NumberBox>2</NumberBox>
              <Text type={TextType.P1}>Configure Request Parameters</Text>
            </StepTitle>
            <Step type={TextType.P1} style={{ width: "336px" }}>
              1. Map appropiate parameter or header in your request to
              UsersTable’s page number property
            </Step>
            <Example type={TextType.P2}>
              Example - Map key <i>pageNo</i> or similar to value
            </Example>
            <BindingKey>
              <Text type={TextType.P2}>{"{{UsersTable.pageNo}}"}</Text>
            </BindingKey>
          </div>
          <GifContainer>
            <GifPlayerComponent
              gif={
                props.theme === EditorTheme.LIGHT ? lightmodeGif : darkmodeGif
              }
            />
            <Text type={TextType.P3}>
              1. How to Configure Table for Pagination
            </Text>
          </GifContainer>
        </PaginationTypeView>
      )}
    </PaginationSection>
  );
}
