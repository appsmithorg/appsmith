// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import widgetPropertyFns from "!!raw-loader!./derived.js";
import { parseDerviedProperties } from "utils/helpers";

const derivedProperties: any = parseDerviedProperties(widgetPropertyFns);

export default derivedProperties;
