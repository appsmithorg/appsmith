import React, { type ReactNode } from "react";

import { Flex, Spinner, Text } from "@appsmith/ads";

import {
  createMessage,
  EMPTY_TABLE_MESSAGE_TEXT,
  EMPTY_TABLE_TITLE_TEXT,
  FAILED_RECORDS_MESSAGE_TEXT,
  FAILED_RECORDS_TITLE_TEXT,
  LOADING_RECORDS_MESSAGE_TEXT,
  LOADING_RECORDS_TITLE_TEXT,
  NO_COLUMNS_MESSAGE_TEXT,
} from "ee/constants/messages";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

type IStates = "LOADING" | "NODATA" | "FAILED" | "NOCOLUMNS";

interface IProps {
  state: IStates;
  height?: string;
}

const StateData: Record<
  IStates,
  { title: string; message: string; image: string | ReactNode }
> = {
  LOADING: {
    title: createMessage(LOADING_RECORDS_TITLE_TEXT),
    message: createMessage(LOADING_RECORDS_MESSAGE_TEXT),
    image: <Spinner size="md" />,
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
};

const StatusDisplay = ({ height, state }: IProps) => {
  const { image, message, title } = StateData[state];

  return (
    <Flex
      alignItems={"center"}
      h={height}
      justifyContent={"center"}
      overflowY={"auto"}
      w="100%"
    >
      <Flex
        alignItems={"center"}
        flexDirection={"column"}
        gap="spaces-7"
        justifyContent={"center"}
        overflowY={"auto"}
        p="spaces-3"
        w="100%"
      >
        {typeof image === "string" ? (
          <img alt={title} className="h-[150px]" src={image} />
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
          <Text kind="body-m">{message}</Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export { StatusDisplay };
