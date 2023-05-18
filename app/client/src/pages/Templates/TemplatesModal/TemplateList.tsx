import {
  FETCHING_TEMPLATE_LIST,
  FORKING_TEMPLATE,
  createMessage,
} from "@appsmith/constants/messages";
import type { Template } from "api/TemplatesApi";
import React from "react";
import { useSelector } from "react-redux";
import {
  isFetchingTemplatesSelector,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { TemplatesContent } from "..";
import Filters from "../Filters";
import TemplateModalHeader from "./Header";
import LoadingScreen from "./LoadingScreen";

const Wrapper = styled.div`
  display: flex;
  height: 85vh;
  overflow: auto;

  .modal-header {
    padding-bottom: ${(props) => props.theme.spaces[4]}px;
  }
`;

const FilterWrapper = styled.div`
  .filter-wrapper {
    width: 200px;
  }
`;

const ListWrapper = styled.div`
  height: 79vh;
  overflow: auto;
  &&::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.modal.scrollbar};
  }
  &::-webkit-scrollbar {
    width: 4px;
  }
`;

type TemplateListProps = {
  onTemplateClick: (id: string) => void;
  onClose: () => void;
};

function TemplateList(props: TemplateListProps) {
  const onForkTemplateClick = (template: Template) => {
    props.onTemplateClick(template.id);
  };
  const isImportingTemplateToApp = useSelector(
    isImportingTemplateToAppSelector,
  );
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);

  if (isFetchingTemplates) {
    return <LoadingScreen text={createMessage(FETCHING_TEMPLATE_LIST)} />;
  }

  if (isImportingTemplateToApp) {
    return <LoadingScreen text={createMessage(FORKING_TEMPLATE)} />;
  }

  return (
    <Wrapper className="flex flex-col">
      <TemplateModalHeader
        className="modal-header"
        hideBackButton
        onClose={props.onClose}
      />
      <div className="flex">
        <FilterWrapper>
          <Filters />
        </FilterWrapper>
        <ListWrapper>
          <TemplatesContent
            isForkingEnabled
            onForkTemplateClick={onForkTemplateClick}
            onTemplateClick={props.onTemplateClick}
            stickySearchBar
          />
        </ListWrapper>
      </div>
    </Wrapper>
  );
}

export default TemplateList;
