import { SubTextPosition } from "components/constants";
// import moment from "moment";
import dayjs from "dayjs";

export const DateFormatOptions = [
  {
    label: dayjs().format("YYYY-MM-DDTHH:mm:ss.sssZ"),
    subText: "ISO 8601",
    value: "YYYY-MM-DDTHH:mm:ss.sssZ",
  },
  {
    label: dayjs().format("LLL"),
    subText: "LLL",
    value: "LLL",
  },
  {
    label: dayjs().format("LL"),
    subText: "LL",
    value: "LL",
  },
  {
    label: dayjs().format("YYYY-MM-DD HH:mm"),
    subText: "YYYY-MM-DD HH:mm",
    value: "YYYY-MM-DD HH:mm",
  },
  {
    label: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
    subText: "YYYY-MM-DDTHH:mm:ss",
    value: "YYYY-MM-DDTHH:mm:ss",
  },
  {
    label: dayjs().format("YYYY-MM-DD hh:mm:ss A"),
    subText: "YYYY-MM-DD hh:mm:ss A",
    value: "YYYY-MM-DD hh:mm:ss A",
  },
  {
    label: dayjs().format("DD/MM/YYYY HH:mm"),
    subText: "DD/MM/YYYY HH:mm",
    value: "DD/MM/YYYY HH:mm",
  },
  {
    label: dayjs().format("D MMMM, YYYY"),
    subText: "D MMMM, YYYY",
    value: "D MMMM, YYYY",
  },
  {
    label: dayjs().format("H:mm A D MMMM, YYYY"),
    subText: "H:mm A D MMMM, YYYY",
    value: "H:mm A D MMMM, YYYY",
  },
  {
    label: dayjs().format("YYYY-MM-DD"),
    subText: "YYYY-MM-DD",
    value: "YYYY-MM-DD",
  },
  {
    label: dayjs().format("MM-DD-YYYY"),
    subText: "MM-DD-YYYY",
    value: "MM-DD-YYYY",
  },
  {
    label: dayjs().format("DD-MM-YYYY"),
    subText: "DD-MM-YYYY",
    value: "DD-MM-YYYY",
  },
  {
    label: dayjs().format("MM/DD/YYYY"),
    subText: "MM/DD/YYYY",
    value: "MM/DD/YYYY",
  },
  {
    label: dayjs().format("DD/MM/YYYY"),
    subText: "DD/MM/YYYY",
    value: "DD/MM/YYYY",
  },
  {
    label: dayjs().format("DD/MM/YY"),
    subText: "DD/MM/YY",
    value: "DD/MM/YY",
  },
  {
    label: dayjs().format("MM/DD/YY"),
    subText: "MM/DD/YY",
    value: "MM/DD/YY",
  },
].map((x) => ({
  ...x,
  subTextPosition: SubTextPosition.BOTTOM,
}));
