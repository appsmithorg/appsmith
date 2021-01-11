// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import widgetPropertyFns from "!!raw-loader!./derived.js";

const derivedProperties: any = {};
const regex = /(\w+):\s?\(props\)\s?=>\s?{([\w\W]*?)},/;

const matches = widgetPropertyFns.match(regex);
console.log("TEST", matches[1], matches[2]);

const value = matches[2].trim().replace(/\n/, "");

derivedProperties[matches[1]] = value;
export default derivedProperties;
