import { removeClassFromDocumentRoot } from "pages/utils";
import React, { useState, useEffect } from "react";
import { FilePickerActionStatus } from "entities/Datasource";
import { useDispatch } from "react-redux";
import { filePickerCallbackAction } from "actions/datasourceActions";
import { GOOGLE_SHEET_FILE_PICKER_OVERLAY_CLASS } from "constants/Datasource";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  createMessage,
  GOOGLE_SHEETS_FILE_PICKER_TITLE,
} from "ee/constants/messages";

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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).googleAPIsLoaded,
  );
  const [pickerInitiated, setPickerInitiated] = useState<boolean>(false);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  // hooks
  const dispatch = useDispatch();

  // objects gapi and google are set, when google apis script is loaded
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gapi: any = (window as any).gapi;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const google: any = (window as any).google;

  useEffect(() => {
    // When google apis javascript does not load, we need to update auth status to failure
    if (!scriptLoadedFlag) {
      dispatch(
        filePickerCallbackAction({
          action: FilePickerActionStatus.CANCEL,
          fileIds: [],
          datasourceId: datasourceId,
        }),
      );
    }
  }, [scriptLoadedFlag]);

  useEffect(() => {
    // Since we need to display file picker on blank page, as soon as file picker is visible
    // Add overlay on the file picker background
    if (pickerVisible) {
      const element: HTMLElement | null =
        document.querySelector(".picker-dialog-bg");
      const elements: NodeListOf<HTMLElement> =
        document.querySelectorAll(".picker-dialog");
      // When the reconnect modal the ads modal disables pointer events everywhere else.
      // To enable selection from the google sheets picker we set pointer events auto to it.
      if (!!element) {
        element.style.pointerEvents = "auto";
      }
      elements.forEach((element) => {
        element.style.pointerEvents = "auto";
      });
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

  // This useEffect will be triggered when google apis script is loaded (script tag added in index.html)
  // and when picker object is successfully loaded (check useEffect above) and
  // and when google sheet token and project id are available
  useEffect(() => {
    if (
      !!gsheetToken &&
      !!scriptLoadedFlag &&
      pickerInitiated &&
      !!google &&
      !!gsheetProjectID
    ) {
      createPicker(gsheetToken, gsheetProjectID);
    }
  }, [gsheetToken, scriptLoadedFlag, pickerInitiated, gsheetProjectID]);

  // This is added in useEffect instead of file picker callback,
  // because in case when browser has blocked third party cookies
  // The file picker needs to be displayed with allow cookies option
  // hence as soon as file picker is visible we should remove the overlay
  // Ref: https://github.com/appsmithorg/appsmith/issues/22753
  useEffect(() => {
    if (!!pickerVisible) {
      // Event would be emitted when file picker initialisation is done,
      // but its either showing cookies permission page or the files to select
      AnalyticsUtil.logEvent("GOOGLE_SHEET_FILE_PICKER_INITIATED");
    }
  }, [pickerVisible]);

  // This triggers google's picker object from google apis script to create file picker and display it
  // It takes google sheet token and project id as inputs
  const createPicker = async (accessToken: string, projectID: string) => {
    const view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS);
    view.setMimeTypes("application/vnd.google-apps.spreadsheet");
    view.setMode(google.picker.DocsViewMode.LIST);
    const title = createMessage(GOOGLE_SHEETS_FILE_PICKER_TITLE);
    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(projectID)
      .setOAuthToken(accessToken)
      .addView(view)
      .setTitle(title)
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
    setPickerVisible(true);
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addAnalyticalEvents = (data: any) => {
    switch (data?.action) {
      case FilePickerActionStatus.LOADED:
        AnalyticsUtil.logEvent("GOOGLE_SHEET_FILE_PICKER_FILES_LISTED");
        break;
      case FilePickerActionStatus.CANCEL:
        AnalyticsUtil.logEvent("GOOGLE_SHEET_FILE_PICKER_CANCEL");
        break;
      case FilePickerActionStatus.PICKED:
        AnalyticsUtil.logEvent("GOOGLE_SHEET_FILE_PICKER_PICKED", {
          numberOfSheetsSelected: data?.docs?.length,
        });
        break;
      default:
        break;
    }
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pickerCallback = async (data: any) => {
    addAnalyticalEvents(data);
    if (
      data.action === FilePickerActionStatus.CANCEL ||
      data.action === FilePickerActionStatus.PICKED
    ) {
      removeClassFromDocumentRoot(GOOGLE_SHEET_FILE_PICKER_OVERLAY_CLASS);
      setPickerVisible(false);
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
