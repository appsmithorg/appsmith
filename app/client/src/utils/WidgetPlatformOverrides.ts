export const fetchPlatformWidgetConfigurationOverrides = () : Record<string, Record<string, unknown>> => {
  /**
   *  since this function is outside the widgets module,
   * it is okay to access redux state in this function as well.
   * Accesing redux state doesn't enforce tight coupling between widget modules
   *  and appsmith platform.
   * */

  /**
   * Widget configuration overrides are part of appsmith platform module,
   *  */


  /**
   * access redux state or
   * make network API call to fetch widget configuraiton overrides here
   *  */

  // return property configuration overrides here
  return {
    "FILE_PICKER_WIDGET_V2" : {
      maxFileSize: 100
    }
  }
}