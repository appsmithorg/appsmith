import type { ReactNode } from "react";
import React, { useCallback } from "react";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import { ControlGroup } from "@blueprintjs/core";
import styled from "styled-components";
import _, { noop } from "lodash";
import { Button, SearchInput, SearchVariant, Size } from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import { getIsFetchingApplications } from "@appsmith/selectors/applicationSelectors";
import { Indices } from "constants/Layers";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { setShowAppInviteUsersDialog } from "@appsmith/actions/applicationActions";

const SubHeaderWrapper = styled.div<{
  isMobile?: boolean;
  isBannerVisible?: boolean;
}>`
  width: ${({ isMobile }) => (isMobile ? `100%` : `250px`)};
  display: flex;
  justify-content: space-between;
  ${(props) =>
    props.isBannerVisible
      ? "margin-top: 96px"
      : `margin-top: ${props.theme.spaces[11]}px`};
  background: ${(props) => props.theme.colors.homepageBackground};
  z-index: ${Indices.Layer9};
  margin-left: ${(props) => props.theme.spaces[4]}px;
  z-index: ${({ isMobile }) => (isMobile ? Indices.Layer8 : Indices.Layer9)};
  ${({ isMobile }) => isMobile && `padding: 12px 16px; margin: 0px;`}
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
    defaultValue?: string;
  };
  isBannerVisible?: boolean;
};

export function ApplicationsSubHeader(props: SubHeaderProps) {
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isMobile = useIsMobileDevice();
  const dispatch = useDispatch();
  const query =
    props.search &&
    props.search.queryFn &&
    _.debounce(props.search.queryFn, 250, { maxWait: 1000 });
  const createTrigger = props.add && (
    <Button size={Size.medium} text={props.add.title} />
  );

  const handleFormOpenOrClose = useCallback((isOpen: boolean) => {
    dispatch(setShowAppInviteUsersDialog(isOpen));
  }, []);

  return (
    <SubHeaderWrapper
      isBannerVisible={props.isBannerVisible}
      isMobile={isMobile}
    >
      <SearchContainer>
        {props.search && (
          <ControlGroup>
            <SearchInput
              border={isMobile}
              cypressSelector={"t--application-search-input"}
              defaultValue={props.search.defaultValue}
              disabled={isFetchingApplications}
              onChange={query || noop}
              placeholder={props.search.placeholder}
              variant={SearchVariant.BACKGROUND}
              width={isMobile ? "100%" : "228px"}
            />
          </ControlGroup>
        )}
      </SearchContainer>

      {props.add && (
        <FormDialogComponent
          Form={props.add.form}
          onOpenOrClose={handleFormOpenOrClose}
          title={props.add.title}
          trigger={createTrigger}
        />
      )}
    </SubHeaderWrapper>
  );
}

export default ApplicationsSubHeader;
