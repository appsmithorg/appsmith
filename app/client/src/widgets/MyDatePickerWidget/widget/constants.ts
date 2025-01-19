import { SubTextPosition } from "components/constants";
import moment from "moment";

export const DateFormatOptions = [
    {
        label: moment().format("YYYY-MM-DDTHH:mm:ss.sssZ"),
        subText: "ISO 8601",
        value: "YYYY-MM-DDTHH:mm:ss.sssZ",
    },
    {
        label: moment().format("YYYY/MM/DDTHH:mm:ss.sssZ"),
        subText: "ISO 8601",
        value: "YYYY/MM/DDTHH:mm:ss.sssZ",
    },
    {
        label: moment().format("YYYY-MM-DD HH:mm"),
        subText: "YYYY-MM-DD HH:mm",
        value: "YYYY-MM-DD HH:mm",
    },
    {
        label: moment().format("YYYY/MM/DD HH:mm"),
        subText: "YYYY/MM/DD HH:mm",
        value: "YYYY/MM/DD HH:mm",
    },
    {
        label: moment().format("YYYY-MM-DDTHH:mm:ss"),
        subText: "YYYY-MM-DDTHH:mm:ss",
        value: "YYYY-MM-DDTHH:mm:ss",
    },
    {
        label: moment().format("YYYY/MM/DDTHH:mm:ss"),
        subText: "YYYY/MM/DDTHH:mm:ss",
        value: "YYYY/MM/DDTHH:mm:ss",
    },
    {
        label: moment().format("YYYY-MM-DD hh:mm:ss A"),
        subText: "YYYY-MM-DD hh:mm:ss A",
        value: "YYYY-MM-DD hh:mm:ss A",
    },
    {
        label: moment().format("YYYY/MM/DD A hh:mm:ss"),
        subText: "YYYY/MM/DD hh:mm:ss A",
        value: "YYYY/MM/DD hh:mm:ss A",
    },
    {
        label: moment().format("DD/MM/YYYY HH:mm"),
        subText: "DD/MM/YYYY HH:mm",
        value: "DD/MM/YYYY HH:mm",
    },
    {
        label: moment().format("D MMMM, YYYY"),
        subText: "D MMMM, YYYY",
        value: "D MMMM, YYYY",
    },
    {
        label: moment().format("D MMMM YYYY"),
        subText: "D MMMM YYYY",
        value: "D MMMM YYYY",
    },
    {
        label: moment().format("YYYY MM DD"),
        subText: "YYYY MM DD",
        value: "YYYY MM DD",
    },
    {
        label: moment().format("H:mm A D MMMM, YYYY"),
        subText: "H:mm A D MMMM, YYYY",
        value: "H:mm A D MMMM, YYYY",
    },
    {
        label: moment().format("D MMMM YYYY H:mm A"),
        subText: "D MMMM YYYY H:mm A",
        value: "D MMMM YYYY H:mm A",
    },
    {
        label: moment().format("YYYY MM DD A H:mm"),
        subText: "YYYY MM DD A H:mm",
        value: "YYYY MM DD A H:mm",
    },
    {
        label: moment().format("DD MM YYYY H:mm A"),
        subText: "DD MM YYYY H:mm A",
        value: "DD MM YYYY H:mm A",
    },
    {
        label: moment().format("YYYY/MM/DD H:mm A"),
        subText: "YYYY/MM/DD H:mm A",
        value: "YYYY/MM/DD H:mm A",
    },

    {
        label: moment().format("YYYY-MM-DD H:mm A"),
        subText: "YYYY-MM-DD H:mm A",
        value: "YYYY-MM-DD H:mm A",
    },
    {
        label: moment().format("YYYY-MM-DD"),
        subText: "YYYY-MM-DD",
        value: "YYYY-MM-DD",
    },
    {
        label: moment().format("YYYY/MM/DD"),
        subText: "YYYY/MM/DD",
        value: "YYYY/MM/DD",
    },
    {
        label: moment().format("MM-DD-YYYY"),
        subText: "MM-DD-YYYY",
        value: "MM-DD-YYYY",
    },
    {
        label: moment().format("DD-MM-YYYY"),
        subText: "DD-MM-YYYY",
        value: "DD-MM-YYYY",
    },
    {
        label: moment().format("MM/DD/YYYY"),
        subText: "MM/DD/YYYY",
        value: "MM/DD/YYYY",
    },
    {
        label: moment().format("DD/MM/YYYY"),
        subText: "DD/MM/YYYY",
        value: "DD/MM/YYYY",
    },
    {
        label: moment().format("DD/MM/YY"),
        subText: "DD/MM/YY",
        value: "DD/MM/YY",
    },
    {
        label: moment().format("YY/MM/DD"),
        subText: "YY/MM/DD",
        value: "YY/MM/DD",
    },
    {
        label: moment().format("YY-MM-DD"),
        subText: "YY-MM-DD",
        value: "YY-MM-DD",
    },
    {
        label: moment().format("MM/DD/YY"),
        subText: "MM/DD/YY",
        value: "MM/DD/YY",
    },
].map((x) => ({
    ...x,
    subTextPosition: SubTextPosition.BOTTOM,
}));
