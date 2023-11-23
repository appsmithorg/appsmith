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
import Template from "../Template";
import RequestTemplate from "../Template/RequestTemplate";
import LoadingScreen from "../TemplatesModal/LoadingScreen";
import { Wrapper, SubheadingText, HorizontalLine } from "./StyledComponents";
import {
  TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
  TEMPLATE_ALL_FILTER_FUNCTION_VALUE,
} from "../constants";

const breakpointColumnsObject = {
  default: 4,
  3000: 3,
  1500: 3,
  1024: 2,
  800: 1,
};

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

          <Masonry
            breakpointCols={breakpointColumnsObject}
            className="grid"
            columnClassName="grid_column"
          >
            {buildingBlocks.map((template) => (
              <Template
                hideForkTemplateButton={props.isForkingEnabled}
                isBuildingBlock
                key={template.id}
                onClick={props.onTemplateClick}
                onForkTemplateClick={props.onForkTemplateClick}
                size="large"
                template={template}
              />
            ))}
            {onlyBuildingBlocksFilterSet && <RequestTemplate />}
          </Masonry>
        </>
      )}

      {showHorizontalLine && <HorizontalLine />}

      {!onlyBuildingBlocksFilterSet && (
        <>
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
    <StartWithTemplateList
      isForkingEnabled={props.isForkingEnabled}
      onForkTemplateClick={props.onForkTemplateClick}
      onTemplateClick={props.onTemplateClick}
      templates={templates}
    />
  );
}
