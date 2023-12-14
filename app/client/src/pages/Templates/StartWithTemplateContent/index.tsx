import { getIsFetchingApplications } from "@appsmith/selectors/applicationSelectors";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import React from "react";
import { useSelector } from "react-redux";
import {
  getSearchedTemplateList,
  getTemplateFilterSelector,
  isFetchingTemplatesSelector,
} from "selectors/templatesSelectors";
import BuildingBlock from "../BuildingBlock";
import FixedHeightTemplate from "../Template/FixedHeightTemplate";
import RequestTemplate from "../Template/RequestTemplate";
import LoadingScreen from "../TemplatesModal/LoadingScreen";
import {
  TEMPLATE_ALL_FILTER_FUNCTION_VALUE,
  TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
} from "../constants";
import {
  HorizontalLine,
  SubheadingText,
  TemplateGrid,
  Wrapper,
} from "./StyledComponents";

interface StartWithTemplateListProps {
  isForkingEnabled: boolean;
  templates: TemplateInterface[];
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
}

function StartWithTemplateList(props: StartWithTemplateListProps) {
  const selectedFilters = useSelector(getTemplateFilterSelector);

  const onlyBuildingBlocksFilterSet =
    selectedFilters?.functions?.length === 1 &&
    selectedFilters.functions[0] ===
      TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE;

  const noBuildingBlockFilterSet = !selectedFilters?.functions?.includes(
    TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
  );

  const allFiltersSet =
    selectedFilters?.functions?.length === 1 &&
    selectedFilters.functions[0] === TEMPLATE_ALL_FILTER_FUNCTION_VALUE;

  const showBuildingBlocksSection = !noBuildingBlockFilterSet || allFiltersSet;
  const showHorizontalLine =
    !onlyBuildingBlocksFilterSet && showBuildingBlocksSection;

  const buildingBlocks = props.templates.filter(
    (template) =>
      template.functions[0] === TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
  );
  const useCaseTemplates = props.templates.filter(
    (template) =>
      template.functions[0] !== TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
  );

  return (
    <Wrapper>
      {showBuildingBlocksSection && (
        <>
          <SubheadingText kind="heading-m">Building blocks</SubheadingText>

          <TemplateGrid>
            {buildingBlocks.map((template) => (
              <BuildingBlock
                buildingBlock={template}
                key={template.id}
                onClick={props.onTemplateClick}
                onForkTemplateClick={props.onForkTemplateClick}
              />
            ))}
            {onlyBuildingBlocksFilterSet && <RequestTemplate />}
          </TemplateGrid>
        </>
      )}

      {showHorizontalLine && <HorizontalLine />}

      {!onlyBuildingBlocksFilterSet && (
        <>
          <SubheadingText kind="heading-m">Operations</SubheadingText>

          <TemplateGrid>
            {useCaseTemplates.map((template) => (
              <FixedHeightTemplate
                hideForkTemplateButton={props.isForkingEnabled}
                key={template.id}
                onClick={props.onTemplateClick}
                onForkTemplateClick={props.onForkTemplateClick}
                template={template}
              />
            ))}
            <RequestTemplate />
          </TemplateGrid>
        </>
      )}
    </Wrapper>
  );
}

interface StartWithTemplateContentProps {
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
  stickySearchBar?: boolean;
  isForkingEnabled: boolean;
  filterWithAllowPageImport?: boolean;
}

export function StartWithTemplateContent(props: StartWithTemplateContentProps) {
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const isLoading = isFetchingApplications || isFetchingTemplates;

  const filterWithAllowPageImport = props.filterWithAllowPageImport || false;
  const templates = useSelector(getSearchedTemplateList).filter((template) =>
    filterWithAllowPageImport ? !!template.allowPageImport : true,
  );

  if (isLoading) {
    return <LoadingScreen text="Loading templates" />;
  }

  return (
    <StartWithTemplateList
      isForkingEnabled={props.isForkingEnabled}
      onForkTemplateClick={props.onForkTemplateClick}
      onTemplateClick={props.onTemplateClick}
      templates={templates}
    />
  );
}
