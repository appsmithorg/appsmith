import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDefaultPageId } from "sagas/selectors";
import { getSettings } from "selectors/settingsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import debounce from "lodash/debounce";
import { updateApplication } from "@appsmith/actions/applicationActions";
import { viewerURL } from "@appsmith/RouteBuilder";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { AppsmithFrameAncestorsSetting } from "./Constants/constants";
import { formatEmbedSettings } from "./Utils/utils";

const regex = /^[1-9][0-9]{0,3}((px)|(em)|(%)|(vw)|(vh))?$/;

const embedSettingContentConfig = {
  [AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE]: {
    icon: "global-line",
    label: createMessage(IN_APP_EMBED_SETTING.allowEmbeddingLabel),
    tooltip: createMessage(IN_APP_EMBED_SETTING.allowEmbeddingTooltip),
  },
  [AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING]: {
    icon: "lock-2-line",
    label: createMessage(IN_APP_EMBED_SETTING.limitEmbeddingLabel),
    tooltip: createMessage(IN_APP_EMBED_SETTING.limitEmbeddingTooltip),
  },
  [AppsmithFrameAncestorsSetting.DISABLE_EMBEDDING_EVERYWHERE]: {
    icon: "forbid-line",
    label: createMessage(IN_APP_EMBED_SETTING.disableEmbeddingLabel),
    tooltip: createMessage(IN_APP_EMBED_SETTING.disableEmbeddingTooltip),
  },
};

type EmbedSetting = keyof typeof embedSettingContentConfig;

function useUpdateEmbedSnippet() {
  const dispatch = useDispatch();
  const application = useSelector(getCurrentApplication);
  const settings = useSelector(getSettings);
  const user = useSelector(getCurrentUser);
  const defaultPageId = useSelector(getDefaultPageId);
  const featureFlags = useSelector(selectFeatureFlags);
  const currentSetting: EmbedSetting = formatEmbedSettings(
    settings["APPSMITH_ALLOWED_FRAME_ANCESTORS"] as string,
  ).value;
  const embedSettingContent = embedSettingContentConfig[currentSetting];
  const [embedSetting, setEmbedSetting] = useState({
    height: "720px",
    width: "1024px",
    ...application?.embedSetting,
  });

  const areDimensionValuesValid = useCallback((embedSetting: any) => {
    const isHeightValid = regex.test(embedSetting.height);
    const isWidthValid = regex.test(embedSetting.width);

    return isHeightValid && isWidthValid;
  }, []);

  const onChange = (setting: any) => {
    if (application) {
      const updatedSetting = { ...embedSetting, ...setting };
      setEmbedSetting((state) => {
        return {
          ...state,
          ...setting,
        };
      });
      areDimensionValuesValid(updatedSetting) &&
        debouncedUpdate(application?.id, updatedSetting);
    }
  };

  useEffect(() => {
    if (user?.isSuperUser) {
      dispatch({
        type: ReduxActionTypes.FETCH_ADMIN_SETTINGS,
      });
    }
  }, []);

  const debouncedUpdate = useCallback(
    debounce(
      (applicationId, embedSetting) => {
        dispatch(
          updateApplication(applicationId, {
            embedSetting,
            currentApp: true,
          }),
        );
      },
      1000,
      {
        leading: true,
      },
    ),
    [],
  );

  const appViewEndPoint = useMemo(() => {
    const url = viewerURL({
      pageId: defaultPageId,
    });
    const allowHidingShareSettingsInEmbedView =
      featureFlags.release_embed_hide_share_settings_enabled;
    const fullUrl = new URL(window.location.origin.toString() + url);
    if (embedSetting?.showNavigationBar) {
      if (allowHidingShareSettingsInEmbedView) {
        fullUrl.searchParams.append("embed", "true");
        fullUrl.searchParams.append("navbar", "true");
      }
      return fullUrl.toString();
    }

    fullUrl.searchParams.append("embed", "true");
    return fullUrl.toString();
  }, [defaultPageId, embedSetting?.showNavigationBar]);

  const snippet = useMemo(() => {
    return `<iframe src="${appViewEndPoint}" width="${embedSetting?.width}" height="${embedSetting?.height}"></iframe>`;
  }, [appViewEndPoint, embedSetting?.width, embedSetting?.height]);

  return {
    appViewEndPoint,
    snippet,
    onChange,
    embedSettingContent,
    currentEmbedSetting: embedSetting,
    isSuperUser: user?.isSuperUser,
  };
}

export default useUpdateEmbedSnippet;
