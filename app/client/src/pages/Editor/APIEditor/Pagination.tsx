import React from "react";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";

import styled from "constants/DefaultTheme";
import FormRow from "components/editorComponents/FormRow";
import { PaginationType } from "entities/Action";
import RadioFieldGroup from "components/editorComponents/form/fields/RadioGroupField";
import Text, { Case, TextType } from "components/ads/Text";
import Button, { Category, Size } from "components/ads/Button";
import {
  CodeEditorBorder,
  EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import GifPlayerComponent from "components/ads/GifPlayerComponent";
import { Classes } from "components/ads/common";
import lightmodeGif from "assets/icons/gifs/config_pagination_lightmode.gif";
import darkmodeGif from "assets/icons/gifs/config_pagination_darkmode.gif";
import lightmodeThumbnail from "assets/icons/gifs/lightmode_thumbnail.png";
import darkmodeThumbnail from "assets/icons/gifs/darkmode_thumbnail.png";

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
  margin-left: 20px;
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
              label: "Paginate with Table Page No",
              value: PaginationType.PAGE_NO,
            },
            {
              label: "Paginate with Response Url",
              value: PaginationType.URL,
            },
          ]}
          placeholder="Method"
          rows={3}
        />
      </FormRow>

      {props.paginationType === PaginationType.URL && (
        <PaginationTypeView>
          <div>
            <Description case={Case.UPPERCASE} type={TextType.H6}>
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
            <PaginationFieldWrapper
              data-replay-id={btoa("actionConfiguration.prev")}
            >
              <DynamicTextField
                border={CodeEditorBorder.ALL_SIDE}
                className="t--apiFormPaginationPrev"
                fill={!!true}
                height="100%"
                name="actionConfiguration.prev"
                theme={props.theme}
              />
              <Button
                category={Category.tertiary}
                className="t--apiFormPaginationPrevTest"
                height="auto"
                onClick={() => {
                  props.onTestClick("PREV");
                }}
                size={Size.medium}
                tag="button"
                text={"Test"}
                type="button"
              />
            </PaginationFieldWrapper>
            <Step type={TextType.P1}>Next url</Step>
            <PaginationFieldWrapper
              data-replay-id={btoa("actionConfiguration.next")}
            >
              <DynamicTextField
                border={CodeEditorBorder.ALL_SIDE}
                className="t--apiFormPaginationNext"
                fill={!!true}
                height="100%"
                name="actionConfiguration.next"
                theme={props.theme}
              />
              <Button
                category={Category.tertiary}
                className="t--apiFormPaginationNextTest"
                height="auto"
                onClick={() => {
                  props.onTestClick("NEXT");
                }}
                size={Size.medium}
                tag="button"
                text={"Test"}
                type="button"
              />
            </PaginationFieldWrapper>
          </div>
          <GifContainer>
            <GifPlayerComponent
              gif={
                props.theme === EditorTheme.LIGHT ? lightmodeGif : darkmodeGif
              }
              thumbnail={
                props.theme === EditorTheme.LIGHT
                  ? lightmodeThumbnail
                  : darkmodeThumbnail
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
            <Description case={Case.UPPERCASE} type={TextType.H6}>
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
            <Step style={{ width: "336px" }} type={TextType.P1}>
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
              thumbnail={
                props.theme === EditorTheme.LIGHT
                  ? lightmodeThumbnail
                  : darkmodeThumbnail
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
