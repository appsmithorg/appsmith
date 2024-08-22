import React, { useEffect } from "react";

import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import WithSuperUserHOC from "ee/pages/AdminSettings/WithSuperUserHoc";
import AdminConfig from "ee/pages/AdminSettings/config";
import LeftPane from "pages/AdminSettings/LeftPane";
import Main from "pages/AdminSettings/Main";
import { LoaderContainer } from "pages/AdminSettings/components";
import PageWrapper from "pages/common/PageWrapper";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { getSettingsLoadingState } from "selectors/settingsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";
import bootIntercom from "utils/bootIntercom";

import { Spinner } from "@appsmith/ads";

const FlexContainer = styled.div`
  display: flex;
  height: 100%;
`;

function Settings() {
  const dispatch = useDispatch();
  const user = useSelector(getCurrentUser);
  const isLoading = useSelector(getSettingsLoadingState);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const isSavable = AdminConfig.savableCategories.includes(
    subCategory ?? category,
  );

  useEffect(() => {
    if (user?.isSuperUser) {
      dispatch({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS,
      });
    }
  }, []);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  return (
    <PageWrapper isFixed isSavable={isSavable}>
      <FlexContainer>
        {isLoading ? (
          <LoaderContainer>
            <Spinner size="lg" />
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
