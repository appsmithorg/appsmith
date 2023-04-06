import { removeHTMLBodyOverlay } from "pages/utils";
import React, { useState, useEffect } from "react";
import { FilePickerActionStatus } from "entities/Datasource";
import { useDispatch } from "react-redux";
import { filePickerCallbackAction } from "actions/datasourceActions";

interface Props {
  datasourceId: string;
  gsheetToken?: string;
  gsheetProjectID?: string;
}

function GoogleSheetFilePicker({
  datasourceId,
  gsheetProjectID,
  gsheetToken,
}: Props) {
  const [scriptLoadedFlag] = useState<boolean>(
    (window as any).googleAPIsLoaded,
  );
  const [pickerInitiated, setPickerInitiated] = useState<boolean>(false);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  // hooks
  const dispatch = useDispatch();

  // objects gapi and google are set, when google apis script is loaded
  const gapi: any = (window as any).gapi;
  const google: any = (window as any).google;

  useEffect(() => {
    // Since we need to display file picker on blank page, as soon as file picker is visible
    // Add overlay on the file picker background
    if (pickerVisible) {
      const element: HTMLElement | null =
        document.querySelector(".picker-dialog-bg");
      if (!!element) {
        element.style.opacity = "1";
      }
    }
  }, [pickerVisible]);

  useEffect(() => {
    // This loads the picker object in gapi script
    if (!!gsheetToken && !!gapi && !!gsheetProjectID) {
      gapi.load("client:picker", async () => {
        await gapi.client.load(
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        );
        setPickerInitiated(true);
      });
    }
  }, [scriptLoadedFlag, gsheetToken, gsheetProjectID]);

  useEffect(() => {
    if (
      !!gsheetToken &&
      scriptLoadedFlag &&
      pickerInitiated &&
      !!google &&
      !!gsheetProjectID
    ) {
      createPicker(gsheetToken, gsheetProjectID);
    }
  }, [gsheetToken, scriptLoadedFlag, pickerInitiated, gsheetProjectID]);

  const createPicker = async (accessToken: string, projectID: string) => {
    const view = new google.picker.View(google.picker.ViewId.SPREADSHEETS);
    view.setMimeTypes("application/vnd.google-apps.spreadsheet");
    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(projectID)
      .setOAuthToken(accessToken)
      .addView(view)
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
    setPickerVisible(true);
  };

  const pickerCallback = async (data: any) => {
    // Remove document body overlay as soon as file picker is loaded
    if (data.action === FilePickerActionStatus.LOADED) {
      removeHTMLBodyOverlay();
    } else if (
      data.action === FilePickerActionStatus.CANCEL ||
      data.action === FilePickerActionStatus.PICKED
    ) {
      setPickerVisible(false);
      const fileIds = data?.docs?.map((element: any) => element.id) || [];
      dispatch(
        filePickerCallbackAction({
          action: data.action,
          datasourceId: datasourceId,
          fileIds: fileIds,
        }),
      );
    }
  };

  return <div />;
}

export default GoogleSheetFilePicker;
