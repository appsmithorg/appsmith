import { useEffect } from "react";
import useBrandingTheme from "../utils/hooks/useBrandingTheme";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "../actions/authActions";
import {
  fetchFeatureFlagsInit,
  fetchProductAlertInit,
} from "../actions/userActions";
import { getCurrentTenant } from "@appsmith/actions/tenantActions";
import { getIsTenantLoading } from "@appsmith/selectors/tenantSelectors";
import { getCurrentUserLoading } from "../selectors/usersSelectors";

export const useFirstRouteLoad = () => {
  const dispatch = useDispatch();
  const tenantIsLoading = useSelector(getIsTenantLoading);
  const currentUserIsLoading = useSelector(getCurrentUserLoading);

  useEffect(() => {
    dispatch(getCurrentUser());
    dispatch(fetchFeatureFlagsInit());
    dispatch(getCurrentTenant());
    dispatch(fetchProductAlertInit());
  }, []);

  useBrandingTheme();

  // hide the top loader once the tenant is loaded
  // Show app only after tenant is loaded (concerns theming and licence check)
  useEffect(() => {
    if (tenantIsLoading === false && currentUserIsLoading === false) {
      const loader = document.getElementById("loader") as HTMLDivElement;
      const appLoadBlock = document.getElementById(
        "app-load-block",
      ) as HTMLDivElement;

      if (loader) {
        loader.style.width = "100vw";

        setTimeout(() => {
          loader.style.opacity = "0";
        });
      }
      if (appLoadBlock) {
        appLoadBlock.style.visibility = "visible";
      }
    }
  }, [tenantIsLoading, currentUserIsLoading]);
};
