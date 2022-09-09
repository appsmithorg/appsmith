import { importTemplateIntoApplication } from "actions/templateActions";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { isFetchingTemplatesSelector } from "selectors/templatesSelectors";
import styled from "styled-components";
import { TemplatesContent } from "..";
import Filters from "../Filters";
import LoadingScreen from "./LoadingScreen";
import { Template } from "api/TemplatesApi";
import TemplateModalHeader from "./Header";
import { createMessage, FETCHING_TEMPLATE_LIST } from "ce/constants/messages";

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
  const dispatch = useDispatch();
  const onForkTemplateClick = (template: Template) => {
    dispatch(importTemplateIntoApplication(template.id, template.title));
  };
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);

  if (isFetchingTemplates) {
    return <LoadingScreen text={createMessage(FETCHING_TEMPLATE_LIST)} />;
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
