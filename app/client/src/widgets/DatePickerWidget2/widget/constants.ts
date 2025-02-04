import { SubTextPosition } from "components/constants";
import { format } from "date-fns";

export const DateFormatOptions = [
  {
    label: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    subText: "ISO 8601",
    value: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  },
  {
    label: format(new Date(), "MMMM d, yyyy h:mm aa"),
    subText: "LLL",
    value: "MMMM d, yyyy h:mm aa",
  },
  {
    label: format(new Date(), "MMMM d, yyyy"),
    subText: "LL",
    value: "MMMM d, yyyy",
  },
  {
    label: format(new Date(), "yyyy-MM-dd HH:mm"),
    subText: "yyyy-MM-dd HH:mm",
    value: "yyyy-MM-dd HH:mm",
  },
  {
    label: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    subText: "yyyy-MM-dd'T'HH:mm:ss",
    value: "yyyy-MM-dd'T'HH:mm:ss",
  },
  {
    label: format(new Date(), "yyyy-MM-dd hh:mm:ss aa"),
    subText: "yyyy-MM-dd hh:mm:ss aa",
    value: "yyyy-MM-dd hh:mm:ss aa",
  },
  {
    label: format(new Date(), "dd/MM/yyyy HH:mm"),
    subText: "dd/MM/yyyy HH:mm",
    value: "dd/MM/yyyy HH:mm",
  },
  {
    label: format(new Date(), "d MMMM, yyyy"),
    subText: "d MMMM, yyyy",
    value: "d MMMM, yyyy",
  },
  {
    label: format(new Date(), "h:mm aa d MMMM, yyyy"),
    subText: "h:mm aa d MMMM, yyyy",
    value: "h:mm aa d MMMM, yyyy",
  },
  {
    label: format(new Date(), "yyyy-MM-dd"),
    subText: "yyyy-MM-dd",
    value: "yyyy-MM-dd",
  },
  {
    label: format(new Date(), "MM-dd-yyyy"),
    subText: "MM-dd-yyyy",
    value: "MM-dd-yyyy",
  },
  {
    label: format(new Date(), "dd-MM-yyyy"),
    subText: "dd-MM-yyyy",
    value: "dd-MM-yyyy",
  },
  {
    label: format(new Date(), "MM/dd/yyyy"),
    subText: "MM/dd/yyyy",
    value: "MM/dd/yyyy",
  },
  {
    label: format(new Date(), "dd/MM/yyyy"),
    subText: "dd/MM/yyyy",
    value: "dd/MM/yyyy",
  },
  {
    label: format(new Date(), "dd/MM/yy"),
    subText: "dd/MM/yy",
    value: "dd/MM/yy",
  },
  {
    label: format(new Date(), "MM/dd/yy"),
    subText: "MM/dd/yy",
    value: "MM/dd/yy",
  },
].map((x) => ({
  ...x,
  subTextPosition: SubTextPosition.BOTTOM,
}));
