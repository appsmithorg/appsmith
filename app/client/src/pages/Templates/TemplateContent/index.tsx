import {
  ADD_PAGE_FROM_TEMPLATE_MODAL,
  createMessage,
} from "ee/constants/messages";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import React from "react";
import { useSelector } from "react-redux";
import {
  getSearchedTemplateList,
  getTemplateFilterSelector,
  isFetchingTemplatesSelector,
} from "selectors/templatesSelectors";
import BuildingBlock from "../BuildingBlock";
import RequestTemplate from "../Template/RequestTemplate";
import LoadingScreen from "../TemplatesModal/LoadingScreen";
import {
  TEMPLATE_ALL_FILTER_FUNCTION_VALUE,
  TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
} from "../constants";
import { getIsFetchingApplications } from "ee/selectors/selectedWorkspaceSelectors";
import {
  HorizontalLine,
  SubheadingText,
  TemplateGrid,
  Wrapper,
} from "./StyledComponents";
import FixedHeightTemplate from "../Template/FixedHeightTemplate";

interface TemplateListProps {
  isForkingEnabled: boolean;
  isModalLayout?: boolean;
  templates: TemplateInterface[];
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
}

function TemplateList(props: TemplateListProps) {
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
    <Wrapper isModalLayout={props.isModalLayout}>
      {!onlyBuildingBlocksFilterSet && (
        <>
          <SubheadingText kind="heading-m">Use case templates</SubheadingText>

          <TemplateGrid>
            {useCaseTemplates.map((template) => (
              <FixedHeightTemplate
                hideForkTemplateButton={!props.isForkingEnabled}
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
      {showHorizontalLine && buildingBlocks.length > 0 && <HorizontalLine />}
      {showBuildingBlocksSection && buildingBlocks.length > 0 && (
        <>
          <SubheadingText kind="heading-m">
            {createMessage(ADD_PAGE_FROM_TEMPLATE_MODAL.buildingBlocksTitle)}
          </SubheadingText>

          <TemplateGrid>
            {buildingBlocks.map((template) => (
              <BuildingBlock
                buildingBlock={template}
                hideForkTemplateButton={!props.isForkingEnabled}
                key={template.id}
                onClick={props.onTemplateClick}
                onForkTemplateClick={props.onForkTemplateClick}
              />
            ))}
            {onlyBuildingBlocksFilterSet && <RequestTemplate isBuildingBlock />}
          </TemplateGrid>
        </>
      )}
    </Wrapper>
  );
}

interface TemplateContentProps {
  isModalLayout?: boolean;
  onTemplateClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
  stickySearchBar?: boolean;
  isForkingEnabled: boolean;
  filterWithAllowPageImport?: boolean;
}

export function TemplateContent(props: TemplateContentProps) {
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
    <TemplateList
      isForkingEnabled={props.isForkingEnabled}
      isModalLayout={props.isModalLayout}
      onForkTemplateClick={props.onForkTemplateClick}
      onTemplateClick={props.onTemplateClick}
      templates={templates}
    />
  );
}
