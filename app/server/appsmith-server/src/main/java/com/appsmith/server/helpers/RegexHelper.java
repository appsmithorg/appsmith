package com.appsmith.server.helpers;

import java.util.Collection;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.PatternConstants.GROUPED_STRING_WITH_START_END;
import static com.appsmith.server.constants.PatternConstants.REGEX_OR_SEPARATOR;
import static com.appsmith.server.constants.PatternConstants.STRING_WITH_START_END;

public class RegexHelper {
    public static String getStringAsRegex(String string) {
        return String.format(STRING_WITH_START_END, Pattern.quote(string));
    }

    public static String getStringsToRegex(Collection<String> strings) {
        return strings.stream()
                .map(string -> String.format(GROUPED_STRING_WITH_START_END, Pattern.quote(string)))
                .collect(Collectors.joining(REGEX_OR_SEPARATOR));
    }
}
