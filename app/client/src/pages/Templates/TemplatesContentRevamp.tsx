import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getIsFetchingApplications } from "@appsmith/selectors/applicationSelectors";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import React, { useEffect } from "react";
import Masonry from "react-masonry-css";
import { useDispatch, useSelector } from "react-redux";
import {
  getSearchedTemplateList,
  getTemplateFilterSelector,
  isFetchingTemplatesSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import Template from "./Template";
import RequestTemplate from "./Template/RequestTemplate";
import LoadingScreen from "./TemplatesModal/LoadingScreen";
import { Text } from "design-system";
import {
  SELECT_A_TEMPLATE_SUBTITLE,
  SELECT_A_TEMPLATE_TITLE,
  createMessage,
} from "@appsmith/constants/messages";

const breakpointColumnsObject = {
  default: 4,
  3000: 3,
  1500: 3,
  1024: 2,
  800: 1,
};

const Wrapper = styled.div`
  padding: 48px;
  background-color: var(--ads-v2-color-bg);
  margin-right: 24px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  .grid {
    display: flex;
  }

  .grid_column {
    padding: 11px;
  }
`;

const TitleText = styled(Text)`
  margin-top: 10px;
  margin-bottom: 8px;
`;

const SubtitleText = styled(Text)`
  margin-bottom: 48px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
`;

const SubheadingText = styled(Text)`
  font-weight: 600;
  margin-bottom: 4px;
`;

const HorizontalLine = styled.div`
  width: 100%;
  height: 1px;
  background-color: var(--ads-v2-color-bg-emphasis);
  margin: 48px 0;
`;

interface TemplateRevampListProps {
  isForkingEnabled: boolean;
  templates: TemplateInterface[];
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
}

const BUILDING_BLOCKS_FUNCTION_VALUE = "Building Block";
function TemplateListRevamp(props: TemplateRevampListProps) {
  const selectedFilters = useSelector(getTemplateFilterSelector);

  const onlyBuildingBlocksFilterSet =
    selectedFilters &&
    selectedFilters.functions &&
    selectedFilters.functions.length === 1 &&
    selectedFilters.functions[0] === BUILDING_BLOCKS_FUNCTION_VALUE;

  const buildingBlocks = props.templates.filter(
    (template) => template.functions[0] === BUILDING_BLOCKS_FUNCTION_VALUE,
  );
  const useCaseTemplates = props.templates.filter(
    (template) => template.functions[0] !== BUILDING_BLOCKS_FUNCTION_VALUE,
  );

  return (
    <Wrapper>
      <SubheadingText kind="heading-m">Building blocks</SubheadingText>

      <Masonry
        breakpointCols={breakpointColumnsObject}
        className="grid"
        columnClassName="grid_column"
      >
        {buildingBlocks.map((template) => (
          <Template
            hideForkTemplateButton={props.isForkingEnabled}
            key={template.id}
            onClick={props.onTemplateClick}
            onForkTemplateClick={props.onForkTemplateClick}
            size="large"
            template={template}
          />
        ))}
      </Masonry>

      {!onlyBuildingBlocksFilterSet && (
        <>
          <HorizontalLine />

          <SubheadingText kind="heading-m">Templates</SubheadingText>

          <Masonry
            breakpointCols={breakpointColumnsObject}
            className="grid"
            columnClassName="grid_column"
          >
            {useCaseTemplates.map((template) => (
              <Template
                hideForkTemplateButton={props.isForkingEnabled}
                key={template.id}
                onClick={props.onTemplateClick}
                onForkTemplateClick={props.onForkTemplateClick}
                size="large"
                template={template}
              />
            ))}
            <RequestTemplate />
          </Masonry>
        </>
      )}
    </Wrapper>
  );
}

interface TemplatesContentProps {
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
  stickySearchBar?: boolean;
  isForkingEnabled: boolean;
  filterWithAllowPageImport?: boolean;
}

export function TemplatesContentRevamp(props: TemplatesContentProps) {
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const isLoading = isFetchingApplications || isFetchingTemplates;
  const dispatch = useDispatch();

  const filterWithAllowPageImport = props.filterWithAllowPageImport || false;
  const templates = useSelector(getSearchedTemplateList).filter((template) =>
    filterWithAllowPageImport ? !!template.allowPageImport : true,
  );

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.RESET_TEMPLATE_FILTERS,
    });
  }, []);

  if (isLoading) {
    return <LoadingScreen text="Loading templates" />;
  }

  return (
    <>
      <Header>
        <TitleText kind="heading-xl">
          {createMessage(SELECT_A_TEMPLATE_TITLE)}
        </TitleText>

        <SubtitleText kind="body-m">
          {createMessage(SELECT_A_TEMPLATE_SUBTITLE)}
        </SubtitleText>
      </Header>

      <TemplateListRevamp
        isForkingEnabled={props.isForkingEnabled}
        onForkTemplateClick={props.onForkTemplateClick}
        onTemplateClick={props.onTemplateClick}
        templates={templates}
      />
    </>
  );
}
