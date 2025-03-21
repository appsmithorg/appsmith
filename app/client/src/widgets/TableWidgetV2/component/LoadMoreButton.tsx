import { Colors } from "constants/Colors";
import React from "react";
import { Flex, Text } from "@appsmith/ads";
import { createMessage, TABLE_LOAD_MORE } from "ee/constants/messages";
import { TEXT_SIZES } from "constants/WidgetConstants";
const LoadMoreButton = ({
  loadMore,
  style,
}: {
  loadMore?: () => void;
  style: React.CSSProperties;
}) => {
  return (
    <Flex
      alignItems="center"
      aria-label="Load more records"
      cursor="pointer"
      justifyContent="flex-start"
      onClick={loadMore}
      role="button"
      style={{ ...style }}
      tabIndex={0}
      zIndex={1000}
    >
      <Text
        className="underline pl-[10px]"
        style={{
          fontWeight: "var(--ads-v2-font-weight-normal)",
          fontSize: TEXT_SIZES.PARAGRAPH,
          color: Colors.GRAY,
          position: "sticky",
          left: 10,
        }}
      >
        {createMessage(TABLE_LOAD_MORE)}
      </Text>
    </Flex>
  );
};

export default LoadMoreButton;
