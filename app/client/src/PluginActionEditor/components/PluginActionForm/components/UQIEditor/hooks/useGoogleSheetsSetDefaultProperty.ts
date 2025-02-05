import { useEffect } from "react";
import { PluginPackageName } from "entities/Plugin";
import { merge } from "lodash";
import { getConfigInitialValues } from "components/formControls/utils";
import { diff, type Diff } from "deep-diff";
import { getPathAndValueFromActionDiffObject } from "utils/getPathAndValueFromActionDiffObject";
import { setActionProperty } from "actions/pluginActionActions";
import { usePluginActionContext } from "../../../../../PluginActionContext";
import { useDispatch } from "react-redux";

export const useGoogleSheetsSetDefaultProperty = () => {
  const {
    action,
    editorConfig,
    plugin: { packageName },
    settingsConfig,
  } = usePluginActionContext();

  const dispatch = useDispatch();

  useEffect(
    function setDefaultValuesForGoogleSheets() {
      if (packageName === PluginPackageName.GOOGLE_SHEETS) {
        const initialValues = {};

        merge(
          initialValues,
          getConfigInitialValues(editorConfig as Record<string, unknown>[]),
        );

        merge(
          initialValues,
          getConfigInitialValues(settingsConfig as Record<string, unknown>[]),
        );

        // initialValues contains merge of action, editorConfig, settingsConfig and will be passed to redux form
        merge(initialValues, action);

        // @ts-expect-error: Types are not available
        const actionObjectDiff: undefined | Diff<Action | undefined, Action>[] =
          diff(action, initialValues);

        const { path = "", value = "" } = {
          ...getPathAndValueFromActionDiffObject(actionObjectDiff),
        };

        if (value && path) {
          dispatch(
            setActionProperty({
              actionId: action.id,
              propertyName: path,
              value,
            }),
          );
        }
      }
    },
    [action, dispatch, editorConfig, packageName, settingsConfig],
  );
};
