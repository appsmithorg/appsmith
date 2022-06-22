// @ts-expect-error: loader types not available
import widgetPropertyFns from "!!raw-loader!./derived.js";

// TODO(abhinav):
// Add unit test cases
// Handle edge cases
// Error out on wrong values
const derivedProperties: any = {};
// const regex = /(\w+):\s?\(props\)\s?=>\s?{([\w\W]*?)},/gim;
const regex = /(\w+):\s?\(props, moment, _\)\s?=>\s?{([\w\W\n]*?)},\n?\s+?\/\//gim;

let m;

while ((m = regex.exec((widgetPropertyFns as unknown) as string)) !== null) {
  // This is necessary to avoid infinite loops with zero-width matches
  if (m.index === regex.lastIndex) {
    regex.lastIndex++;
  }

  let key = "";
  // The result can be accessed through the `m`-variable.
  m.forEach((match, groupIndex) => {
    if (groupIndex === 1) {
      key = match;
    }
    if (groupIndex === 2) {
      derivedProperties[key] = match
        .trim()
        .replace(/\n/g, "")
        .replace(/props\./g, "this.");
    }
  });
}

export default derivedProperties;
