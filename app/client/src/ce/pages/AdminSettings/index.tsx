import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import PageWrapper from "@appsmith/pages/common/PageWrapper";
import { getSettingsLoadingState } from "selectors/settingsSelectors";
import styled from "styled-components";
import LeftPane from "@appsmith/pages/AdminSettings/LeftPane";
import Main from "@appsmith/pages/AdminSettings/Main";
import WithSuperUserHOC from "@appsmith/pages/AdminSettings/WithSuperUserHoc";
import { getCurrentUser } from "selectors/usersSelectors";
import bootIntercom from "utils/bootIntercom";
import { LoaderContainer } from "pages/Settings/components";
import { useParams } from "react-router";
import AdminConfig from "@appsmith/pages/AdminSettings/config";
import { Spinner } from "design-system";
import {
  getIsTenantLoading,
  getTenantPermissions,
} from "@appsmith/selectors/tenantSelectors";
import { getDefaultAdminSettingsPath } from "@appsmith/utils/adminSettingsHelpers";
import history from "utils/history";
import { useLocation } from "react-router-dom";

const FlexContainer = styled.div`
  display: flex;
  height: 100%;
`;

function Settings() {
  const dispatch = useDispatch();
  const user = useSelector(getCurrentUser);
  const location = useLocation();
  const tenantPermissions = useSelector(getTenantPermissions);
  const isSettingsLoading = useSelector(getSettingsLoadingState);
  const isTenantLoading = useSelector(getIsTenantLoading);
  const isLoading = isSettingsLoading || isTenantLoading;
  const params = useParams() as any;
  const { category, selected: subCategory } = params;
  const isSavable = AdminConfig.savableCategories.includes(
    subCategory ?? category,
  );

  // Fetch admin settings for super user
  useEffect(() => {
    if (user?.isSuperUser) {
      dispatch({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS,
      });
    }
  }, [user]);

  // Boot intercom
  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  // Redirect user to correct settings they have access to
  useEffect(() => {
    if (!isLoading && user) {
      const route = getDefaultAdminSettingsPath({
        isSuperUser: user.isSuperUser,
        tenantPermissions,
      });
      if (route !== location.pathname) {
        history.replace(route);
      }
    }
  }, [isLoading, user, tenantPermissions]);

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
