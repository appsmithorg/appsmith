export * from "ce/pages/AdminSettings/config/branding/useBrandingForm";

import { useDispatch } from "react-redux";

import AnalyticsUtil from "utils/AnalyticsUtil";
import { updateTenantConfig } from "@appsmith/actions/tenantActions";

/**
 * grabs all the dirty values from the form
 *
 * source: // https://github.com/react-hook-form/react-hook-form/discussions/1991#discussioncomment-351784
 *
 * @param dirtyFields
 * @param allValues
 * @returns
 */
export const pluckDirtyValues = (dirtyFields: any, allValues: any): any => {
  // NOTE: Recursive function.

  // If *any* item in an array was modified, the entire array must be submitted, because there's no
  // way to indicate "placeholders" for unchanged elements. `dirtyFields` is `true` for leaves.
  if (dirtyFields === true || Array.isArray(dirtyFields)) {
    return allValues;
  }

  // Here, we have an object.
  return Object.fromEntries(
    Object.keys(dirtyFields).map((key) => [
      key,
      pluckDirtyValues(dirtyFields[key], allValues[key]),
    ]),
  );
};

type useBrandingFormProps = {
  dirtyFields: Record<string, any>;
};

export const useBrandingForm = (props: useBrandingFormProps) => {
  const { dirtyFields } = props;
  const dispatch = useDispatch();
  /**
   * on submit for branding form, we need to pluck the dirty values
   * and send it to the server
   *
   * @param data
   */
  const onSubmit = (data: any) => {
    const values = pluckDirtyValues(dirtyFields, data);

    const formData: Record<string, any> = new FormData();

    // this is required so that branding env values shows up in tenant api
    const tenantConfig: any = { APPSMITH_BRAND_ENABLE: "true" };

    for (const key in values) {
      if (values[key] instanceof File) {
        formData.append(key, values[key]);

        continue;
      }

      if (typeof values[key] === "object") {
        tenantConfig[key] = values[key];

        continue;
      }

      tenantConfig[key] = values[key];
    }

    formData.append("tenantConfig", JSON.stringify(tenantConfig));

    dispatch(
      updateTenantConfig({
        tenantConfiguration: formData,
        isOnlyTenantSettings: true,
      }),
    );

    AnalyticsUtil.logEvent("BRANDING_SUBMIT_CLICK");
  };

  return {
    onSubmit,
  };
};
