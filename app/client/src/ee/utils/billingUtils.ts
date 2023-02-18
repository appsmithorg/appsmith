import { createMessage, NOT_AVAILABLE } from "@appsmith/constants/messages";
import { openInNewTab } from "@appsmith/utils";
import isNil from "lodash/isNil";

//TODO : Update to customer.appsmith.com when going live
export const CUSTOMER_PORTAL_URL =
  "https://release-customer.appsmith.com/plans";

export const goToCustomerPortal = () => {
  openInNewTab(CUSTOMER_PORTAL_URL);
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
    return `${date}${getDateSuffix(date)} ${month} ${year}`;
  } else {
    return createMessage(NOT_AVAILABLE);
  }
};
