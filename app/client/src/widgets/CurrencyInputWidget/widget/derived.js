/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  isValid: (props, moment, _) => {
    let hasValidValue, value;
    try {
      value = Number(props.value);
      hasValidValue = Number.isFinite(value);
    } catch (e) {
      return false;
    }

    if (!props.isRequired && (props.text === "" || props.text === undefined)) {
      return true;
    }
    if (props.isRequired && !hasValidValue) {
      return false;
    }

    if (typeof props.validation === "boolean" && !props.validation) {
      return false;
    }

    let parsedRegex = null;
    if (props.regex) {
      /*
       * break up the regexp pattern into 4 parts: given regex, regex prefix , regex pattern, regex flags
       * Example /test/i will be split into ["/test/gi", "/", "test", "gi"]
       */
      const regexParts = props.regex.match(/(\/?)(.+)\\1([a-z]*)/i);

      if (!regexParts) {
        parsedRegex = new RegExp(props.regex);
      } else {
        if (
          regexParts[3] &&
          !/^(?!.*?(.).*?\\1)[gmisuy]+$/.test(regexParts[3])
        ) {
          parsedRegex = RegExp(props.regex);
        } else {
          /*
           * if we have a regex flags, use it to form regexp
           */
          parsedRegex = new RegExp(regexParts[2], regexParts[3]);
        }
      }
    }
    if (parsedRegex) {
      return parsedRegex.test(props.text);
    } else {
      return hasValidValue;
    }
  },
  //
  value: (props, moment, _) => {
    const text = props.text;

    function getLocale() {
      return navigator.languages?.[0] || "en-US";
    }

    function getLocaleDecimalSeperator() {
      return Intl.NumberFormat(getLocale())
        .format(1.1)
        .replace(/\p{Number}/gu, "");
    }

    function getLocaleThousandSeparator() {
      return Intl.NumberFormat(getLocale())
        .format(11111)
        .replace(/\p{Number}/gu, "");
    }

    if (text) {
      const parsed = parseFloat(
        text
          .replace(new RegExp(`[${getLocaleThousandSeparator()}]`, "g"), "")
          .replace(new RegExp(`[${getLocaleDecimalSeperator()}]`), "."),
      );

      if (_.isNaN(parsed)) {
        parsed = undefined;
      }

      return parsed;
    } else {
      return undefined;
    }
  },
  //
};
