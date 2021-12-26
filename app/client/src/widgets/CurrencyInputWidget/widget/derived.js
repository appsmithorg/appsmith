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
        /*
        * if we don't have a regex flags (gmisuy), convert provided string into regexp directly
        /*
        if (regexParts[3] && !/^(?!.*?(.).*?\\1)[gmisuy]+$/.test(regexParts[3])) {
          parsedRegex = RegExp(props.regex);
        }
        /*
        * if we have a regex flags, use it to form regexp
        */
        parsedRegex = new RegExp(regexParts[2], regexParts[3]);
      }
    }
    if (parsedRegex) {
      return parsedRegex.test(props.text);
    } else {
      return hasValidValue;
    }
  },
  //
  defaultValueValidation(value, props, _) {
    const NUMBER_ERROR_MESSAGE = "This value must be number";
    const EMPTY_ERROR_MESSAGE = "";
    if (_.isObject(value)) {
      return {
        isValid: false,
        parsed: JSON.stringify(value, null, 2),
        messages: [NUMBER_ERROR_MESSAGE],
      };
    }

    let parsed = Number(value);
    let isValid, messages;

    if (_.isString(value) && value.trim() === "") {
      /*
       *  When value is emtpy string
       */
      isValid = true;
      messages = [EMPTY_ERROR_MESSAGE];
      parsed = undefined;
    } else if (!Number.isFinite(parsed)) {
      /*
       *  When parsed value is not a finite numer
       */
      isValid = false;
      messages = [NUMBER_ERROR_MESSAGE];
      parsed = undefined;
    } else {
      /*
       *  When parsed value is a Number
       */
      isValid = true;
      messages = [EMPTY_ERROR_MESSAGE];
    }

    return {
      isValid,
      parsed,
      messages,
    };
  },
  //
};
