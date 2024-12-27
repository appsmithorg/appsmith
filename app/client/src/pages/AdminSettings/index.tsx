import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import PageWrapper from "pages/common/PageWrapper";
import { getSettingsLoadingState } from "selectors/settingsSelectors";
import styled from "styled-components";
import LeftPane from "pages/AdminSettings/LeftPane";
import Main from "pages/AdminSettings/Main";
import WithSuperUserHOC from "ee/pages/AdminSettings/WithSuperUserHoc";
import { getCurrentUser } from "selectors/usersSelectors";
import bootIntercom from "utils/bootIntercom";
import { LoaderContainer } from "pages/AdminSettings/components";
import { useParams } from "react-router";
import AdminConfig from "ee/pages/AdminSettings/config";
import { Spinner } from "@appsmith/ads";
import MixpanelSingleton from "../../utils/Analytics/mixpanel";

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
    // Stop recording this screen
    MixpanelSingleton.getInstance().stopRecording();

    return () => {
      // Start recording after this screen unmounts
      MixpanelSingleton.getInstance().startRecording();
    };
  }, []);

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
