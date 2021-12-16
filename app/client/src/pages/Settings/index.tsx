import { Spinner } from "@blueprintjs/core";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import PageWrapper from "pages/common/PageWrapper";
import React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getSettingsLoadingState } from "selectors/settingsSelectors";
import styled from "styled-components";
import LeftPane from "./LeftPane";
import Main from "./Main";
import WithSuperUserHOC from "./WithSuperUserHoc";

const FlexContainer = styled.div`
  display: flex;
`;

const LoaderContainer = styled.div`
  height: ${(props) => `calc(100vh - ${props.theme.smallHeaderHeight})`};
  display: flex;
  justify-content: center;
  width: 100%;
`;

function Settings() {
  const dispatch = useDispatch();
  const isLoading = useSelector(getSettingsLoadingState);
  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.FETCH_ADMIN_SETTINGS,
    });
    dispatch({
      type: ReduxActionTypes.FETCH_RELEASES,
    });
  }, []);

  return (
    <PageWrapper>
      <FlexContainer>
        {isLoading ? (
          <LoaderContainer>
            <Spinner />
          </LoaderContainer>
        ) : (
          <>
            <LeftPane />
            <Main />
          </>
        )}
      </FlexContainer>
    </PageWrapper>
  );
}

export default WithSuperUserHOC(Settings);
