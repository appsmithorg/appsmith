import React from "react";
import { API_RESPONSE_TYPE_OPTIONS } from "constants/ApiEditorConstants/CommonApiConstants";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { isString } from "lodash";
import Table from "pages/Editor/QueryEditor/Table";

type ResponseData = string | Record<string, unknown>[];

const inputValue = (data: ResponseData) => {
  return {
    value: isString(data) ? data : JSON.stringify(data, null, 2),
  };
};

const tableValue = (data: ResponseData): Record<string, unknown>[] => {
  if (isString(data)) {
    return [{}];
  }

  return data;
};

export const responseTabComponent = (
  responseType: string,
  data: ResponseData,
  tableBodyHeight?: number,
): JSX.Element => {
  return {
    [API_RESPONSE_TYPE_OPTIONS.JSON]: (
      <ReadOnlyEditor folding height={"100%"} input={inputValue(data)} />
    ),
    [API_RESPONSE_TYPE_OPTIONS.TABLE]: (
      <Table data={tableValue(data)} tableBodyHeight={tableBodyHeight} />
    ),
    [API_RESPONSE_TYPE_OPTIONS.RAW]: (
      <ReadOnlyEditor
        folding
        height={"100%"}
        input={inputValue(data)}
        isRawView
      />
    ),
  }[responseType];
};
