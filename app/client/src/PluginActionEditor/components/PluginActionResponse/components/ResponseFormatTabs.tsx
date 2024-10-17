import React from "react";
import { ResponseDisplayFormats } from "../../../constants/CommonApiConstants";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { isString } from "lodash";
import Table from "./Table";

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

export const ResponseFormatTabs = (props: {
  responseType: string;
  data: ResponseData;
  tableBodyHeight?: number;
}) => {
  switch (props.responseType) {
    case ResponseDisplayFormats.JSON:
      return (
        <ReadOnlyEditor
          folding
          height={"100%"}
          input={inputValue(props.data)}
        />
      );
    case ResponseDisplayFormats.TABLE:
      return (
        <Table
          data={tableValue(props.data)}
          tableBodyHeight={props.tableBodyHeight}
        />
      );
    case ResponseDisplayFormats.RAW:
      return (
        <ReadOnlyEditor
          folding
          height={"100%"}
          input={inputValue(props.data)}
          isRawView
        />
      );
    default:
      return (
        <ReadOnlyEditor
          folding
          height={"100%"}
          input={inputValue(props.data)}
          isRawView
        />
      );
  }
};
