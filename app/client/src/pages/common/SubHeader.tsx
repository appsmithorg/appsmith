import React, { ReactNode } from "react";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { ControlGroup } from "@blueprintjs/core";
import styled from "styled-components";
import _, { noop } from "lodash";
import SearchInput, { SearchVariant } from "components/ads/SearchInput";
import Button, { Size } from "components/ads/Button";
import { useSelector } from "react-redux";
import { getIsFetchingApplications } from "selectors/applicationSelectors";
import { Indices } from "constants/Layers";

const SubHeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  position: fixed;
  padding-top: 30px;
  background: ${(props) => props.theme.colors.homepageBackground};
  top: ${(props) => props.theme.homePage.header}px;
  left: 369px;
  z-index: ${Indices.Layer3};
`;
const SearchContainer = styled.div`
  flex-grow: 1;
  .bp3-control-group {
    display: block;
  }
  && {
    .bp3-input {
      width: 40%;
    }
  }
`;

type SubHeaderProps = {
  add?: {
    form: ReactNode;
    title: string;
    formName: string;
    isAdding: boolean;
    formSubmitIntent: string;
    errorAdding?: string;
    formSubmitText: string;
    onClick: () => void;
  };
  search?: {
    placeholder: string;
    debounce?: boolean;
    queryFn?: (keyword: string) => void;
  };
};

export function ApplicationsSubHeader(props: SubHeaderProps) {
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const query =
    props.search &&
    props.search.queryFn &&
    _.debounce(props.search.queryFn, 250, { maxWait: 1000 });
  const createTrigger = props.add && (
    <Button size={Size.medium} text={props.add.title} />
  );

  return (
    <SubHeaderWrapper>
      <SearchContainer>
        {props.search && (
          <ControlGroup>
            <SearchInput
              cypressSelector={"t--application-search-input"}
              disabled={isFetchingApplications}
              onChange={query || noop}
              placeholder={props.search.placeholder}
              variant={SearchVariant.SEAMLESS}
            />
          </ControlGroup>
        )}
      </SearchContainer>

      {props.add && (
        <FormDialogComponent
          Form={props.add.form}
          title={props.add.title}
          trigger={createTrigger}
        />
      )}
    </SubHeaderWrapper>
  );
}

export default ApplicationsSubHeader;
