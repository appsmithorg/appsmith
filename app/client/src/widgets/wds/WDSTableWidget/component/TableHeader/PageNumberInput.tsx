import { Keys } from "@blueprintjs/core";
import { TextField } from "@appsmith/wds";
import React, { useCallback, useEffect, useState } from "react";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

const MIN_PAGE_COUNT = 1;

function PageNumberInputComponent(props: {
  pageNo: number;
  pageCount: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  disabled: boolean;
  excludeFromTabOrder?: boolean;
}) {
  const [pageNumber, setPageNumber] = useState(props.pageNo || "0");

  useEffect(() => {
    setPageNumber(props.pageNo || 0);
  }, [props.pageNo]);

  const handleUpdatePageNo = useCallback(
    (e) => {
      const oldPageNo = props.pageNo || 0;
      let page = Number(e.target.value);

      // check page is less then min page count
      if (isNaN(page) || page < MIN_PAGE_COUNT) {
        page = MIN_PAGE_COUNT;
      }

      // check page is greater then max page count
      if (page > props.pageCount) {
        page = props.pageCount;
      }

      // fire Event based on new page number
      if (oldPageNo < page) {
        props.updatePageNo(page, EventType.ON_NEXT_PAGE);
      } else if (oldPageNo > page) {
        props.updatePageNo(page, EventType.ON_PREV_PAGE);
      }

      setPageNumber(page);
    },
    [props.pageNo, props.pageCount, props.updatePageNo],
  );

  return (
    <TextField
      className="t--table-widget-page-input"
      excludeFromTabOrder={props.excludeFromTabOrder}
      isDisabled={props.disabled}
      onBlur={handleUpdatePageNo}
      onChange={(value) => {
        setPageNumber(value);
      }}
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onKeyDown={(e: any) => {
        if (e.keyCode === Keys.ENTER) {
          handleUpdatePageNo(e);
        }
      }}
      size="small"
      value={pageNumber.toString()}
    />
  );
}

export const PageNumberInput = React.memo(PageNumberInputComponent);
