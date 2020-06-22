import React from "react";
import { Icon } from "@blueprintjs/core";
import moment from "moment-timezone";
import {
  MenuColumnWrapper,
  CellWrapper,
  ActionWrapper,
} from "./TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { ColumnMenuOptionProps } from "./ReactTableComponent";
import { isString } from "lodash";
import VideoComponent from "components/designSystems/appsmith/VideoComponent";

interface MenuOptionProps {
  columnAccessor?: string;
  isColumnHidden: boolean;
  columnType: string;
  format?: string;
  hideColumn: (isColumnHidden: boolean) => void;
  updateAction: (action: string) => void;
  updateColumnType: (columnType: string) => void;
  handleUpdateCurrencySymbol: (currencySymbol: string) => void;
  handleDateFormatUpdate: (dateFormat: string) => void;
}

export const getMenuOptions = (props: MenuOptionProps) => {
  const basicOptions: ColumnMenuOptionProps[] = [
    {
      content: "Rename a Column",
      closeOnClick: true,
      id: "rename_column",
      onClick: () => {
        props.updateAction("rename_column");
      },
    },
    {
      content: props.isColumnHidden ? "Show Column" : "Hide Column",
      closeOnClick: true,
      id: "hide_column",
      onClick: () => {
        props.hideColumn(props.isColumnHidden);
      },
    },
  ];
  if (props.columnAccessor && props.columnAccessor === "actions") {
    return basicOptions;
  }
  const columnMenuOptions: ColumnMenuOptionProps[] = [
    ...basicOptions,
    {
      content: "Select a Data Type",
      id: "change_column_type",
      category: true,
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "image"}>
          <Icon
            icon="media"
            iconSize={12}
            color={props.columnType === "image" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Image</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === "image",
      onClick: (isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType("");
        } else {
          props.updateColumnType("image");
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "video"}>
          <Icon
            icon="video"
            iconSize={12}
            color={props.columnType === "video" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Video</div>
        </MenuColumnWrapper>
      ),
      isSelected: props.columnType === "video",
      closeOnClick: true,
      onClick: (isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType("");
        } else {
          props.updateColumnType("video");
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "text"}>
          <Icon
            icon="label"
            iconSize={12}
            color={props.columnType === "text" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Text</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === "text",
      onClick: (isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType("");
        } else {
          props.updateColumnType("text");
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "currency"}>
          <Icon
            icon="dollar"
            iconSize={12}
            color={props.columnType === "currency" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Currency</div>
          <Icon
            className="sub-menu"
            icon="chevron-right"
            iconSize={16}
            color={props.columnType === "currency" ? "#ffffff" : "#2E3D49"}
          />
        </MenuColumnWrapper>
      ),
      closeOnClick: false,
      isSelected: props.columnType === "currency",
      options: [
        {
          content: "USD - $",
          isSelected: props.format === "$",
          closeOnClick: true,
          onClick: () => {
            props.handleUpdateCurrencySymbol("$");
          },
        },
        {
          content: "INR - ₹",
          isSelected: props.format === "₹",
          closeOnClick: true,
          onClick: () => {
            props.handleUpdateCurrencySymbol("₹");
          },
        },
        {
          content: "GBP - £",
          isSelected: props.format === "£",
          closeOnClick: true,
          onClick: () => {
            props.handleUpdateCurrencySymbol("£");
          },
        },
        {
          content: "AUD - A$",
          isSelected: props.format === "A$",
          closeOnClick: true,
          onClick: () => {
            props.handleUpdateCurrencySymbol("A$");
          },
        },
        {
          content: "EUR - €",
          isSelected: props.format === "€",
          closeOnClick: true,
          onClick: () => {
            props.handleUpdateCurrencySymbol("€");
          },
        },
        {
          content: "SGD - S$",
          isSelected: props.format === "S$",
          closeOnClick: true,
          onClick: () => {
            props.handleUpdateCurrencySymbol("S$");
          },
        },
        {
          content: "CAD - C$",
          isSelected: props.format === "C$",
          closeOnClick: true,
          onClick: () => {
            props.handleUpdateCurrencySymbol("C$");
          },
        },
      ],
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "date"}>
          <Icon
            icon="calendar"
            iconSize={12}
            color={props.columnType === "date" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Date</div>
          <Icon
            className="sub-menu"
            icon="chevron-right"
            iconSize={16}
            color={props.columnType === "date" ? "#ffffff" : "#2E3D49"}
          />
        </MenuColumnWrapper>
      ),
      closeOnClick: false,
      isSelected: props.columnType === "date",
      options: [
        {
          content: "MM-DD-YY",
          isSelected: props.format === "MM-DD-YY",
          closeOnClick: true,
          onClick: () => {
            props.handleDateFormatUpdate("MM-DD-YY");
          },
        },
        {
          content: "DD-MM-YY",
          isSelected: props.format === "DD-MM-YY",
          closeOnClick: true,
          onClick: () => {
            props.handleDateFormatUpdate("DD-MM-YY");
          },
        },
        {
          content: "DD/MM/YY",
          isSelected: props.format === "DD/MM/YY",
          closeOnClick: true,
          onClick: () => {
            props.handleDateFormatUpdate("DD/MM/YY");
          },
        },
        {
          content: "MM/DD/YY",
          isSelected: props.format === "MM/DD/YY",
          closeOnClick: true,
          onClick: () => {
            props.handleDateFormatUpdate("MM/DD/YY");
          },
        },
      ],
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === "time"}>
          <Icon
            icon="time"
            iconSize={12}
            color={props.columnType === "time" ? "#ffffff" : "#2E3D49"}
          />
          <div className="title">Time</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === "time",
      onClick: (isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType("");
        } else {
          props.updateColumnType("time");
        }
      },
    },
  ];
  return columnMenuOptions;
};

export const renderCell = (
  value: any,
  rowIndex: number,
  columnType: string,
  isHidden: boolean,
  widgetId: string,
  format?: string,
) => {
  if (!value) {
    return <div></div>;
  }
  switch (columnType) {
    case "image":
      if (!isString(value)) {
        return (
          <CellWrapper isHidden={isHidden}>
            <div>Invalid Image </div>
          </CellWrapper>
        );
      }
      const imageRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png)??(?:&?[^=&]*=[^=&]*)*/;
      return (
        <CellWrapper isHidden={isHidden}>
          {value
            .toString()
            .split(",")
            .map((item: string, index: number) => {
              if (imageRegex.test(item)) {
                return (
                  <div
                    key={index}
                    className="image-cell"
                    style={{ backgroundImage: `url("${item}")` }}
                  />
                );
              } else {
                return <div>Invalid Image</div>;
              }
            })}
        </CellWrapper>
      );
    case "video":
      const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
      if (isString(value) && youtubeRegex.test(value)) {
        return (
          <CellWrapper isHidden={isHidden} className="video-cell">
            <VideoComponent url={value} />
          </CellWrapper>
        );
      } else {
        return (
          <CellWrapper isHidden={isHidden}>Invalid Video Link</CellWrapper>
        );
      }
    case "currency":
      if (!isNaN(value)) {
        return (
          <CellWrapper isHidden={isHidden}>{`${format}${value}`}</CellWrapper>
        );
      } else {
        return <CellWrapper isHidden={isHidden}>Invalid Value</CellWrapper>;
      }
    case "date":
      let isValidDate = true;
      if (isNaN(value)) {
        const dateTime = Date.parse(value);
        if (isNaN(dateTime)) {
          isValidDate = false;
        }
      }
      if (isValidDate) {
        return (
          <CellWrapper isHidden={isHidden}>
            {moment(value).format(format)}
          </CellWrapper>
        );
      } else {
        return <CellWrapper isHidden={isHidden}>Invalid Date</CellWrapper>;
      }
    case "time":
      let isValidTime = true;
      if (isNaN(value)) {
        const time = Date.parse(value);
        if (isNaN(time)) {
          isValidTime = false;
        }
      }
      if (isValidTime) {
        return (
          <CellWrapper isHidden={isHidden}>
            {moment(value).format("HH:mm")}
          </CellWrapper>
        );
      } else {
        return <CellWrapper isHidden={isHidden}>Invalid Time</CellWrapper>;
      }
    case "text":
      const text = isString(value) ? value : JSON.stringify(value);
      return <CellWrapper isHidden={isHidden}>{text}</CellWrapper>;
    default:
      const data = isString(value) ? value : JSON.stringify(value);
      return <CellWrapper isHidden={isHidden}>{data}</CellWrapper>;
  }
};

interface RenderActionProps {
  columnActions?: ColumnAction[];
  onCommandClick: (dynamicTrigger: string) => void;
}

export const renderActions = (props: RenderActionProps) => {
  if (!props.columnActions) return <CellWrapper isHidden={false}></CellWrapper>;
  return (
    <CellWrapper isHidden={false}>
      {props.columnActions.map((action: ColumnAction, index: number) => {
        return (
          <ActionWrapper
            key={index}
            onClick={() => {
              props.onCommandClick(action.dynamicTrigger);
            }}
          >
            {action.label}
          </ActionWrapper>
        );
      })}
    </CellWrapper>
  );
};
