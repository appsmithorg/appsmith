import React, { type ReactNode } from "react";

import { Button, Flex, Spinner, Text } from "@appsmith/ads";

import {
  createMessage,
  EMPTY_TABLE_MESSAGE_TEXT,
  EMPTY_TABLE_TITLE_TEXT,
  FAILED_RECORDS_MESSAGE_TEXT,
  FAILED_RECORDS_TITLE_TEXT,
  LOADING_RECORDS_MESSAGE_TEXT,
  LOADING_SCHEMA_TITLE_TEXT,
  NO_COLUMNS_MESSAGE_TEXT,
  EMPTY_SCHEMA_TITLE_TEXT,
  EMPTY_SCHEMA_MESSAGE_TEXT,
  EDIT_DATASOURCE,
  LOADING_RECORDS_TITLE_TEXT,
  CANT_SHOW_SCHEMA,
} from "ee/constants/messages";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

enum SchemaDisplayStatus {
  SCHEMA_LOADING = "SCHEMA_LOADING",
  LOADING = "LOADING",
  NOSCHEMA = "NOSCHEMA",
  NODATA = "NODATA",
  FAILED = "FAILED",
  NOCOLUMNS = "NOCOLUMNS",
  CANTSHOW = "CANTSHOW",
}

interface Props {
  state: SchemaDisplayStatus;
  editDatasource?: () => void;
  errorMessage?: string;
}

const StateData: Record<
  SchemaDisplayStatus,
  { title?: string; message?: string; image: string | ReactNode }
> = {
  SCHEMA_LOADING: {
    title: createMessage(LOADING_SCHEMA_TITLE_TEXT),
    message: createMessage(LOADING_RECORDS_MESSAGE_TEXT),
    image: <Spinner size="md" />,
  },
  LOADING: {
    title: createMessage(LOADING_RECORDS_TITLE_TEXT),
    message: createMessage(LOADING_RECORDS_MESSAGE_TEXT),
    image: <Spinner size="md" />,
  },
  NOSCHEMA: {
    title: createMessage(EMPTY_SCHEMA_TITLE_TEXT),
    message: createMessage(EMPTY_SCHEMA_MESSAGE_TEXT),
    image: getAssetUrl(`${ASSETS_CDN_URL}/empty-state.svg`),
  },
  NODATA: {
    title: createMessage(EMPTY_TABLE_TITLE_TEXT),
    message: createMessage(EMPTY_TABLE_MESSAGE_TEXT),
    image: getAssetUrl(`${ASSETS_CDN_URL}/empty-state.svg`),
  },
  FAILED: {
    title: createMessage(FAILED_RECORDS_TITLE_TEXT),
    message: createMessage(FAILED_RECORDS_MESSAGE_TEXT),
    image: getAssetUrl(`${ASSETS_CDN_URL}/failed-state.svg`),
  },
  NOCOLUMNS: {
    title: createMessage(EMPTY_TABLE_TITLE_TEXT),
    message: createMessage(NO_COLUMNS_MESSAGE_TEXT),
    image: getAssetUrl(`${ASSETS_CDN_URL}/empty-state.svg`),
  },
  CANTSHOW: {
    message: createMessage(CANT_SHOW_SCHEMA),
    image: getAssetUrl(`${ASSETS_CDN_URL}/empty-state.svg`),
  },
};

const StatusDisplay = ({ editDatasource, errorMessage, state }: Props) => {
  const { image, message, title } = StateData[state];

  return (
    <Flex
      alignItems={"center"}
      flexDirection={"column"}
      gap="spaces-7"
      h="100%"
      justifyContent={"start"}
      overflowY={"scroll"}
      p="spaces-3"
      w="100%"
    >
      {typeof image === "string" ? (
        <Flex alignItems={"center"} h="150px" justifyContent={"center"}>
          <img alt={title} className="h-full" src={image} />
        </Flex>
      ) : (
        image
      )}
      <Flex
        alignItems={"center"}
        className="text-center"
        flexDirection="column"
        justifyContent={"center"}
        maxWidth="400px"
      >
        <Text kind="heading-xs">{title}</Text>
        <Text kind="body-m">
          {state === "FAILED" && errorMessage ? errorMessage : message}
        </Text>
        {state === "FAILED" && (
          <Button
            className="mt-[16px]"
            kind="secondary"
            onClick={editDatasource}
            size={"sm"}
          >
            {createMessage(EDIT_DATASOURCE)}
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export { StatusDisplay, SchemaDisplayStatus };
