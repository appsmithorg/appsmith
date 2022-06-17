import { importTemplateIntoApplication } from "actions/templateActions";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { isFetchingTemplatesSelector } from "selectors/templatesSelectors";
import styled from "styled-components";
import Icon from "components/ads/Icon";
import { TemplatesContent } from "..";
import Filters from "../Filters";
import LoadingScreen from "./LoadingScreen";

const Wrapper = styled.div`
  display: flex;
  height: 85vh;
  overflow: auto;
`;

const FilterWrapper = styled.div`
  .filter-wrapper {
    width: 200px;
  }
`;

const ListWrapper = styled.div`
  height: 80vh;
  overflow: auto;
`;

const CloseIcon = styled(Icon)`
  svg {
    height: 24px;
    width: 24px;
  }
`;

type TemplateListProps = {
  onTemplateClick: (id: string) => void;
  onClose: () => void;
};

function TemplateList(props: TemplateListProps) {
  const dispatch = useDispatch();
  const onForkTemplateClick = (id: string) => {
    dispatch(importTemplateIntoApplication(id));
  };
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);

  if (isFetchingTemplates) {
    return <LoadingScreen text="Loading templates list" />;
  }

  return (
    <Wrapper className="flex flex-col">
      <div className="flex justify-end">
        <CloseIcon name="close-x" onClick={props.onClose} />
      </div>
      <div className="flex">
        <FilterWrapper>
          <Filters />
        </FilterWrapper>
        <ListWrapper>
          <TemplatesContent
            onForkTemplateClick={onForkTemplateClick}
            onTemplateClick={props.onTemplateClick}
          />
        </ListWrapper>
      </div>
    </Wrapper>
  );
}

export default TemplateList;
