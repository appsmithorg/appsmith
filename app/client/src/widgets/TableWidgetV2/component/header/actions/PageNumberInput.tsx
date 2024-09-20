import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { NumericInput, Keys } from "@blueprintjs/core";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { lightenColor } from "widgets/WidgetUtils";

const PageNumberInputWrapper = styled(NumericInput)<{
  borderRadius: string;
  accentColor?: string;
}>`
  &&& input {
    box-shadow: none;
    border: 1px solid var(--wds-color-border);
    background: var(--wds-color-bg);
    box-sizing: border-box;
    width: 24px;
    height: 24px;
    line-height: 24px;
    padding: 0 !important;
    text-align: center;
    font-size: 12px;
    border-radius: ${({ borderRadius }) => borderRadius};

    &:disabled {
      border-color: var(--wds-color-border-disabled);
      background: var(--wds-color-bg-disabled);
      color: var(--wds-color-text-disabled);
    }
  }

  &&&.bp3-control-group > :only-child {
    border-radius: 0;
  }

  & input:hover:not(:disabled) {
    border-color: var(--wds-color-border-hover) !important;
  }

  & input:focus {
    box-shadow: 0 0 0 2px ${({ accentColor }) => lightenColor(accentColor)} !important;
    border-color: ${({ accentColor }) => accentColor} !important;
  }
  margin: 0 8px;
`;

const MIN_PAGE_COUNT = 1;

function PageNumberInputComponent(props: {
  pageNo: number;
  pageCount: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  disabled: boolean;
  borderRadius: string;
  accentColor?: string;
}) {
  const [pageNumber, setPageNumber] = React.useState(props.pageNo || 0);

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
    <PageNumberInputWrapper
      accentColor={props.accentColor}
      borderRadius={props.borderRadius}
      buttonPosition="none"
      clampValueOnBlur
      className="t--table-widget-page-input"
      disabled={props.disabled}
      max={props.pageCount || 1}
      min={1}
      onBlur={handleUpdatePageNo}
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onKeyDown={(e: any) => {
        if (e.keyCode === Keys.ENTER) {
          handleUpdatePageNo(e);
        }
      }}
      onValueChange={(value: number) => {
        setPageNumber(value);
      }}
      value={pageNumber}
    />
  );
}

export const PageNumberInput = React.memo(PageNumberInputComponent);
