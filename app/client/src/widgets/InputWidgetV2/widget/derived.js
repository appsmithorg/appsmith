/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  isValid: (props, moment, _) => {
    let hasValidValue, value;
    switch (props.inputType) {
      case "NUMBER":
      case "INTEGER":
        try {
          value = Number(props.text);
          hasValidValue = Number.isFinite(value);
          break;
        } catch (e) {
          return false;
        }
      case "TEXT":
      case "EMAIL":
      case "PASSWORD":
        value = props.text;
        hasValidValue = !!value;
        break;
      default:
        value = props.text;
        hasValidValue = !!value;
        break;
    }

    if (!props.isRequired && !hasValidValue) {
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
    switch (props.inputType) {
      case "EMAIL":
        const emailRegex = new RegExp(
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        );
        if (!emailRegex.test(value)) {
          /* email should conform to generic email regex */
          return false;
        } else if (parsedRegex) {
          /* email should conform to user specified regex */
          return parsedRegex.test(props.text);
        } else {
          return true;
        }
      case "NUMBER":
      case "INTEGER":
      case "TEXT":
      case "PASSWORD":
        if (parsedRegex) {
          return parsedRegex.test(props.text);
        } else {
          return hasValidValue;
        }
    }
  },
  //
};
