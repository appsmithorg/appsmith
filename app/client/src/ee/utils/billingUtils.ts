import { getAppsmithConfigs } from "@appsmith/configs";
import { createMessage, NOT_AVAILABLE } from "@appsmith/constants/messages";
import { openInNewTab } from "@appsmith/utils";
import isNil from "lodash/isNil";

const appsmithConfigs = getAppsmithConfigs();

export const goToCustomerPortal = () => {
  openInNewTab(`${appsmithConfigs.customerPortalUrl}/plans`);
};

export const getDateSuffix = (date = "") => {
  const parsedDate = Number(date);

  if (date !== "" && !isNil(date) && typeof parsedDate === "number") {
    const j = parsedDate % 10,
      k = parsedDate % 100;

    if (j == 1 && k != 11) {
      return "st";
    }
    if (j == 2 && k != 12) {
      return "nd";
    }
    if (j == 3 && k != 13) {
      return "rd";
    }

    return "th";
  } else {
    return "";
  }
};

export const getDateString = (timestamp?: number) => {
  if (timestamp) {
    const [, month, date, year] = new Date(timestamp).toDateString().split(" ");
    return `${date.replace(/\b0/g, "")}${getDateSuffix(date)} ${month} ${year}`;
  } else {
    return createMessage(NOT_AVAILABLE);
  }
};

export const getRemainingDaysFromTimestamp = (timestamp = Date.now()) => {
  const totalHours = Math.floor(
    (new Date(timestamp).getTime() - Date.now()) / (1000 * 60 * 60),
  );
  if (totalHours <= 720 && totalHours > 708) {
    return {
      days: 30,
      suffix: "days",
    };
  }
  if (totalHours <= 12) {
    return {
      days: totalHours,
      suffix: totalHours > 1 ? "hours" : "hour",
    };
  }
  const days = Math.floor((totalHours - 12) / 24) + 1;
  return {
    days,
    suffix: days > 1 ? "days" : "day",
  };
};
