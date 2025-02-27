import { Colors } from "constants/Colors";
import React from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { useAppsmithTable } from "../TableContext";
import {
  TableHeaderInnerWrapper,
  TableHeaderWrapper,
} from "../TableStyledWrappers";
import BannerNActions from "./BannerNActions";

export default function TableHeader() {
  const { serverSidePaginationEnabled, tableSizes, variant, width } =
    useAppsmithTable();

  return (
    <SimpleBar
      style={{
        maxHeight: tableSizes.TABLE_HEADER_HEIGHT,
      }}
    >
      <TableHeaderWrapper
        backgroundColor={Colors.WHITE}
        serverSidePaginationEnabled={serverSidePaginationEnabled}
        tableSizes={tableSizes}
        width={width}
      >
        <TableHeaderInnerWrapper
          backgroundColor={Colors.WHITE}
          serverSidePaginationEnabled={serverSidePaginationEnabled}
          tableSizes={tableSizes}
          variant={variant}
          width={width}
        >
          <BannerNActions />
        </TableHeaderInnerWrapper>
      </TableHeaderWrapper>
    </SimpleBar>
  );
}
