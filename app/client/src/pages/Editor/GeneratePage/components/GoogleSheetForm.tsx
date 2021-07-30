import React, { useEffect, useCallback } from "react";
// import styled from "styled-components";
// import Dropdown from "components/ads/Dropdown";
// import { getTypographyByKey } from "constants/DefaultTheme";
import { useSelector, useDispatch } from "react-redux";
import { getEditorConfig } from "selectors/entitiesSelector";
import { AppState } from "reducers/index";
import { DropdownOption } from "components/ads/Dropdown";
import { fetchPluginFormConfig } from "actions/pluginActions";
import {
  executeDatasourceQuery,
  executeDatasourceQuerySuccessPayload,
} from "../../../../actions/datasourceActions";
import { DropdownOptions } from "./constants";

// const GOOGLE_SHEET_METHODS = {
//   GET_ALL_SPREADSHEETS: "LIST", // Get all the spreadsheets
//   GET_ALL_SHEETS: "INFO", // fetch all the sub-sheets
//   GET_ALL_COLUMNS: "GET", // Get column names
// };

const DEMO_LIST_DATA = [
  {
    key: "method",
    value: "LIST",
  },
  {
    key: "sheetUrl",
  },
  {
    key: "range",
    value: "",
  },
  {
    key: "spreadsheetName",
    value: "",
  },
  {
    key: "tableHeaderIndex",
    value: "1",
  },
  {
    key: "queryFormat",
    value: "ROWS",
  },
  {
    key: "rowLimit",
    value: "",
  },
  {
    key: "sheetName",
    value: "",
  },
  {
    key: "rowOffset",
    value: "",
  },
  {
    key: "rowObject",
  },
  {
    key: "rowObjects",
  },
  {
    key: "rowIndex",
    value: "",
  },
  {
    key: "deleteFormat",
    value: "SHEET",
  },
];

// const DROPDOWN_DIMENSION = {
//   HEIGHT: "36px",
//   WIDTH: "404px",
// };
// //  ---------- Styles ----------

// const SelectWrapper = styled.div`
//   margin: 10px;
// `;

// const Label = styled.p`
//   ${(props) => `${getTypographyByKey(props, "p1")}`}
// `;

// const Bold = styled.span`
//   font-weight: 500;
// `;

// Types

type Props = {
  googleSheetPluginId: string;
  selectedDatasource: DropdownOption;
  setSelectedDatasourceIsInvalid: (isInvalid: boolean) => void;
  setSelectedDatasourceTableOptions: React.Dispatch<
    React.SetStateAction<DropdownOptions>
  >;
};

// ---------- GoogleSheetForm Component -------

function GoogleSheetForm(props: Props) {
  const {
    googleSheetPluginId,
    selectedDatasource,
    setSelectedDatasourceIsInvalid,
    setSelectedDatasourceTableOptions,
  } = props;

  const dispatch = useDispatch();

  const googleSheetEditorConfig = useSelector((state: AppState) =>
    getEditorConfig(state, googleSheetPluginId),
  );

  // TODO :- Create loading state and set Loading state false on success or error
  const onFetchAllSpreadsheetFailure = (error: any) => {
    console.log({ error });
  };

  const onFetchAllSpreadsheetSuccess = useCallback(
    (payload: executeDatasourceQuerySuccessPayload) => {
      const tableOptions: DropdownOptions = [];
      if (payload.data && payload.data.body) {
        const spreadSheets = payload.data.body;

        if (Array.isArray(spreadSheets)) {
          spreadSheets.map(({ id, name }) => {
            tableOptions.push({
              id,
              label: name,
              value: id,
            });
            setSelectedDatasourceTableOptions(tableOptions);
          });
        } else {
          // to handle error like "401 Unauthorized"
          setSelectedDatasourceIsInvalid(true);
        }
      }
    },
    [setSelectedDatasourceIsInvalid, setSelectedDatasourceTableOptions],
  );

  useEffect(() => {
    // Check if google sheet editor config is fetched.
    // if not, fetch it.

    if (!googleSheetEditorConfig) {
      dispatch(
        fetchPluginFormConfig({
          pluginId: selectedDatasource.data?.pluginId,
        }),
      );
    }
  }, [googleSheetEditorConfig]);

  useEffect(() => {
    // On change of datasource selection
    // if googleSheetEditorConfig if fetched then get all spreadsheets

    if (selectedDatasource.id && googleSheetEditorConfig) {
      dispatch(
        executeDatasourceQuery({
          payload: {
            datasourceId: selectedDatasource.id,
            data: DEMO_LIST_DATA,
          },
          onSuccessCallback: onFetchAllSpreadsheetSuccess,
          onErrorCallback: onFetchAllSpreadsheetFailure,
        }),
      );
    }
  }, [selectedDatasource.value, googleSheetEditorConfig, dispatch]);

  return <div />;
}

export default GoogleSheetForm;
