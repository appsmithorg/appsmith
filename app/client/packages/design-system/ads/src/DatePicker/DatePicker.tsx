import React, { useEffect, useState } from "react";
import BaseDatePicker from "react-datepicker";
import range from "lodash/range";
import getYear from "date-fns/getYear";
import getMonth from "date-fns/getMonth";
import clsx from "classnames";

import "react-datepicker/dist/react-datepicker.css";
import "./styles.module.css";
import {
  DatePickerCalenderClassName,
  DatePickerCalenderHeaderClassName,
  DatePickerClassName,
  DatePickerFooterClassName,
  DatePickerFooterClearClassName,
  DatePickerFooterTodayClassName,
  DateRangePickerClassName,
  DateTimePickerClassName,
} from "./DatePicker.constants";
import type {
  DatePickerHeaderProps,
  DatePickerProps,
  DateRange,
  DateRangePickerProps,
  DateRangeShortcut,
  DateRangeShortcutsConfig,
  DateRangeShortcutsProps,
  ExcludeShortcuts,
} from "./DatePicker.types";
import {
  DatePickerFooter,
  DatePickerShortcut,
  DatePickerShortcutContainer,
  DatePickerShortcutItem,
  StyledDatePickerHeader,
} from "./DatePicker.styles";
import { Input } from "../Input";
import { Button } from "../Button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../Menu";
import { Divider } from "../Divider";

function DatePicker(props: DatePickerProps) {
  const {
    calendarClassName,
    className,
    dateFormat = "MM/dd/yyyy",
    inputProps,
    inputSize = "md",
    isClearable,
    isDisabled,
    isReadOnly,
    isRequired,
    label,
    onChange,
    placeholderText = "Select date",
    selected,
    yearEndRange,
    yearStartRange,
    ...rest
  } = props;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (selected !== selectedDate) {
      setSelectedDate(selected || null);
    }
  }, [selected]);

  const onChangeHandler = (
    date: Date | null,
    e: React.SyntheticEvent<any, Event> | undefined,
  ) => {
    setSelectedDate(date);
    onChange && onChange(date, e);

    if (e) {
      setIsOpen(false);
    }
  };

  return (
    <BaseDatePicker
      {...rest}
      calendarClassName={clsx(DatePickerCalenderClassName, calendarClassName, {
        [DateTimePickerClassName]: rest.showTimeInput,
      })}
      className={clsx(className, DatePickerClassName)}
      customInput={
        <Input
          {...inputProps}
          endIcon={
            isClearable && selectedDate ? "close-circle-line" : undefined
          }
          endIconProps={{
            onClick: () => onChangeHandler(null, undefined),
          }}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired}
          label={label}
          renderAs="input"
          size={inputSize}
          style={{ caretColor: "transparent" }}
        />
      }
      dateFormat={dateFormat}
      disabled={isDisabled}
      monthsShown={1}
      onChange={onChangeHandler}
      onClickOutside={() => setIsOpen(false)}
      onInputClick={() => setIsOpen(true)}
      onKeyDown={(e: any) => {
        // handling esc key press
        if (e.keyCode === 27) {
          setIsOpen(false);
        }
      }}
      open={isOpen}
      placeholderText={placeholderText}
      readOnly={isReadOnly}
      renderCustomHeader={(props) => {
        return (
          <DatePickerHeader
            {...props}
            dateRangePicker={false}
            endYear={yearEndRange}
            startYear={yearStartRange}
          />
        );
      }}
      required={isRequired}
      selected={selectedDate}
      selectsRange={false}
      showPopperArrow={false}
      timeInputLabel=""
    >
      {props.showTimeInput ? (
        <>
          <Divider />
          <DatePickerFooter className={DatePickerFooterClassName}>
            <Button
              className={DatePickerFooterTodayClassName}
              kind="tertiary"
              onClick={(e) => onChangeHandler(new Date(), e)}
            >
              Today
            </Button>
            <Button
              className={DatePickerFooterClearClassName}
              kind="tertiary"
              onClick={(e) => onChangeHandler(null, e)}
            >
              Clear
            </Button>
          </DatePickerFooter>
        </>
      ) : null}
    </BaseDatePicker>
  );
}

// Credits to blueprint(https://github.com/palantir/blueprint/blob/develop/packages/datetime/src/shortcuts.tsx#L132)
function clone(d: Date) {
  return new Date(d.getTime());
}

function createShortcut(
  label: string,
  dateRange: DateRange,
): DateRangeShortcut {
  return { dateRange, label };
}

export function createDefaultShortcuts(
  allowSameDay: boolean,
  excludeShortcuts: ExcludeShortcuts[],
  useSingleDateShortcuts: boolean,
) {
  const today = new Date();
  const makeDate = (action: (d: Date) => void) => {
    const returnVal = clone(today);

    action(returnVal);
    returnVal.setDate(returnVal.getDate() + 1);

    return returnVal;
  };

  const yesterday = makeDate((d) => d.setDate(d.getDate() - 2));
  const oneWeekAgo = makeDate((d) => d.setDate(d.getDate() - 7));
  const oneMonthAgo = makeDate((d) => d.setMonth(d.getMonth() - 1));
  const threeMonthsAgo = makeDate((d) => d.setMonth(d.getMonth() - 3));
  const sixMonthsAgo = makeDate((d) => d.setMonth(d.getMonth() - 6));
  const oneYearAgo = makeDate((d) => d.setFullYear(d.getFullYear() - 1));
  const twoYearsAgo = makeDate((d) => d.setFullYear(d.getFullYear() - 2));

  const singleDateShortcuts = allowSameDay || useSingleDateShortcuts;

  return [
    ...(singleDateShortcuts && !excludeShortcuts.includes("today")
      ? [createShortcut("Today", [today, today])]
      : []),
    ...(singleDateShortcuts && !excludeShortcuts.includes("yesterday")
      ? [createShortcut("Yesterday", [yesterday, yesterday])]
      : []),
    ...(excludeShortcuts.includes("past_week")
      ? []
      : [
          createShortcut(useSingleDateShortcuts ? "1 week ago" : "Past week", [
            oneWeekAgo,
            today,
          ]),
        ]),
    ...(excludeShortcuts.includes("past_month")
      ? []
      : [
          createShortcut(
            useSingleDateShortcuts ? "1 month ago" : "Past month",
            [oneMonthAgo, today],
          ),
        ]),
    ...(excludeShortcuts.includes("past_3_months")
      ? []
      : [
          createShortcut(
            useSingleDateShortcuts ? "3 months ago" : "Past 3 months",
            [threeMonthsAgo, today],
          ),
        ]),
    // Don't include a couple of these for the single date shortcut
    ...(useSingleDateShortcuts || excludeShortcuts.includes("past_6_months")
      ? []
      : [createShortcut("Past 6 months", [sixMonthsAgo, today])]),
    ...(useSingleDateShortcuts || excludeShortcuts.includes("past_year")
      ? []
      : [
          createShortcut(useSingleDateShortcuts ? "1 year ago" : "Past year", [
            oneYearAgo,
            today,
          ]),
        ]),
    ...(useSingleDateShortcuts || excludeShortcuts.includes("past_2_years")
      ? []
      : [createShortcut("Past 2 years", [twoYearsAgo, today])]),
  ];
}

function DateRangeShortcuts(props: DateRangeShortcutsProps) {
  const {
    allowSameDay = false,
    currentDates,
    excludeShortcuts = [],
    onChangeHandler,
    showRangeShortcuts = false,
    useSingleDateShortcuts = false,
    ...rest
  } = props;
  const shortCuts = createDefaultShortcuts(
    allowSameDay,
    excludeShortcuts,
    useSingleDateShortcuts,
  );
  const [selectedShortCut, setSelectedShortCut] = useState<
    DateRangeShortcut | undefined
  >();

  useEffect(() => {
    if (currentDates) {
      const currentSelectedShortcut = shortCuts.find(
        (each) =>
          each.dateRange[0]?.toDateString() ===
            currentDates[0]?.toDateString() &&
          each.dateRange[1]?.toDateString() === currentDates[1]?.toDateString(),
      );

      setSelectedShortCut(currentSelectedShortcut);
    }
  }, [currentDates]);

  return showRangeShortcuts ? (
    <DatePickerShortcutContainer {...rest}>
      <DatePickerShortcut>
        {shortCuts.map((each) => {
          const onClickHandle = (e: any) => {
            onChangeHandler(each.dateRange, e, "shortcut");
          };
          const isSelected = selectedShortCut?.label === each.label;

          return (
            <DatePickerShortcutItem
              data-selected={isSelected}
              key={each.label}
              onClick={onClickHandle}
            >
              {each.label}
            </DatePickerShortcutItem>
          );
        })}
      </DatePickerShortcut>
      <Divider orientation="vertical" />
    </DatePickerShortcutContainer>
  ) : null;
}

function DatePickerHeader(props: DatePickerHeaderProps) {
  const {
    changeMonth,
    changeYear,
    className,
    customHeaderCount,
    dateRangePicker,
    decreaseMonth,
    endYear,
    increaseMonth,
    monthDate,
    nextMonthButtonDisabled,
    prevMonthButtonDisabled,
    startYear,
  } = props;

  const [selectedYear, setSelectedYear] = useState<number>(getYear(monthDate));
  const startRange = startYear || 1990;
  const endRange = endYear || getYear(new Date());
  const years = range(startRange, endRange + 1, 1);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // TODO: Fix this, causing unexpected behavior
  // const handleScroll = React.useCallback((menuItem) => {
  //   setTimeout(() => {
  //     if (!menuItem) return;
  //     menuItem?.scrollIntoView({ behavior: "smooth"});
  //   }, 0);
  // }, []);
  useEffect(() => {
    const year = monthDate.getFullYear();

    if (year !== selectedYear) {
      setSelectedYear(year);
    }
  }, [monthDate]);
  const handleYearChange = (year: number) => {
    changeYear(year);
    setSelectedYear(year);
  };

  return (
    <StyledDatePickerHeader
      className={clsx(DatePickerCalenderHeaderClassName, className)}
    >
      <div>
        {customHeaderCount === 0 && (
          <Button
            disabled={prevMonthButtonDisabled}
            isIconButton
            kind="tertiary"
            onClick={decreaseMonth}
            startIcon="arrow-left-s-line"
          />
        )}
        <Menu>
          <MenuTrigger>
            <Button
              disabled={prevMonthButtonDisabled}
              endIcon="arrow-down-s-line"
              kind="tertiary"
              size="md"
            >
              {months[getMonth(monthDate)]}
            </Button>
          </MenuTrigger>
          <MenuContent
            loop
            portalProps={{
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              container: document.getElementsByClassName(
                DatePickerCalenderClassName,
              )[0],
            }}
            style={{ minWidth: "60px" }}
          >
            {months.map((month) => (
              <MenuItem
                key={month}
                onSelect={() => changeMonth(months.indexOf(month))}
              >
                {month}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      </div>
      <div>
        <Menu>
          <MenuTrigger>
            <Button
              disabled={prevMonthButtonDisabled}
              endIcon="arrow-down-s-line"
              kind="tertiary"
              size="md"
            >
              {selectedYear}
            </Button>
          </MenuTrigger>
          <MenuContent
            loop
            portalProps={{
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              container: document.getElementsByClassName(
                DatePickerCalenderClassName,
              )[0],
            }}
            style={{ minWidth: "unset" }}
          >
            {years.map((year) => (
              <MenuItem
                data-value={year}
                key={year}
                onSelect={() => handleYearChange(year)}
                // ref={year === selectedYear ? handleScroll : undefined}
              >
                {year}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
        {(customHeaderCount === 1 || !dateRangePicker) && (
          <Button
            disabled={nextMonthButtonDisabled}
            isIconButton
            kind="tertiary"
            onClick={increaseMonth}
            startIcon="arrow-right-s-line"
          />
        )}
      </div>
    </StyledDatePickerHeader>
  );
}

function DateRangePicker(
  props: DateRangePickerProps & DateRangeShortcutsConfig,
) {
  const {
    calendarClassName,
    className,
    dateFormat = "MM/dd/yyyy",
    endDate: propEndDate,
    inputProps,
    inputSize = "md",
    isClearable,
    isDisabled,
    isReadOnly,
    isRequired,
    label,
    onChange,
    placeholderText = "Select date range",
    showPreviousMonths = false,
    startDate: propStartDate,
    yearEndRange,
    yearStartRange,
    ...rest
  } = props;
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showPreviousMonthsState, setShowPreviousMonths] =
    useState<boolean>(showPreviousMonths);

  useEffect(() => {
    if (propStartDate !== startDate) {
      setStartDate(propStartDate || null);
    }

    if (propEndDate !== endDate) {
      setEndDate(propEndDate || null);
    }
  }, [propStartDate, propEndDate]);

  const onChangeHandler = (
    date: [Date | null, Date | null],
    e: React.SyntheticEvent<any, Event> | undefined,
    type?: string,
  ) => {
    const [startDate, endDate] = date;

    setStartDate(startDate);
    setEndDate(endDate);
    onChange && onChange(date, e);

    if (type === "shortcut") {
      setIsOpen(false);
    }

    if (showPreviousMonths) {
      // doing this to avoid janky behaviour when navigating through the datepicker.
      setShowPreviousMonths(false);
    }
  };

  const onClearhandler = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <BaseDatePicker
      {...rest}
      calendarClassName={clsx(
        DatePickerCalenderClassName,
        DateRangePickerClassName,
        calendarClassName,
        props.showRangeShortcuts && "showRangeShortcuts",
      )}
      className={clsx(className, DatePickerClassName)}
      customInput={
        <Input
          {...inputProps}
          endIcon={
            isClearable && (startDate || endDate)
              ? "close-circle-line"
              : undefined
          }
          // TODO: Replace this with tertiary button
          endIconProps={{
            onClick: onClearhandler,
          }}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired}
          label={label}
          renderAs="input"
          size={inputSize}
        />
      }
      dateFormat={dateFormat}
      disabled={isDisabled}
      endDate={endDate}
      monthsShown={2}
      onChange={onChangeHandler}
      onClickOutside={() => setIsOpen(false)}
      onInputClick={() => setIsOpen(true)}
      onKeyDown={(e: any) => {
        // handling esc key press
        if (e.keyCode === 27) {
          setIsOpen(false);
        }
      }}
      open={isOpen}
      placeholderText={placeholderText}
      readOnly={isReadOnly}
      renderCustomHeader={(props) => {
        return (
          <DatePickerHeader
            {...props}
            dateRangePicker
            endYear={yearEndRange}
            startYear={yearStartRange}
          />
        );
      }}
      required={isRequired}
      selected={startDate}
      selectsRange
      showPopperArrow={false}
      showPreviousMonths={showPreviousMonthsState}
      showTimeInput={false}
      startDate={startDate}
    >
      <DateRangeShortcuts
        allowSameDay={props.allowSameDay}
        currentDates={[startDate, endDate]}
        excludeShortcuts={props.excludeShortcuts}
        onChangeHandler={onChangeHandler}
        showRangeShortcuts={props.showRangeShortcuts}
        useSingleDateShortcuts={props.useSingleDateShortcuts}
      />
    </BaseDatePicker>
  );
}

DatePicker.displayName = "DatePicker";

DatePicker.defaultProps = {};

DateRangePicker.displayName = "DateRangePicker";

DateRangePicker.defaultProps = {};

export { DatePicker, DateRangePicker };
