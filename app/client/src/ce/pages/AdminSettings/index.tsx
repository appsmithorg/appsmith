import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "@blueprintjs/core";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import PageWrapper from "pages/common/PageWrapper";
import { getSettingsLoadingState } from "selectors/settingsSelectors";
import styled from "styled-components";
import LeftPane from "@appsmith/pages/AdminSettings/LeftPane";
import Main from "@appsmith/pages/AdminSettings/Main";
import WithSuperUserHOC from "pages/Settings/WithSuperUserHoc";
import { getCurrentUser } from "selectors/usersSelectors";
import bootIntercom from "utils/bootIntercom";

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
  const user = useSelector(getCurrentUser);
  const isLoading = useSelector(getSettingsLoadingState);

  useEffect(() => {
    dispatch({
      type: ReduxActionTypes.FETCH_ADMIN_SETTINGS,
    });
    dispatch({
      type: ReduxActionTypes.FETCH_RELEASES,
    });
  }, []);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

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
