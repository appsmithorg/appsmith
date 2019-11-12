package com.appsmith.server.helpers;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class MustacheHelper {

    // This regex matches mustache template keys of the form {{somekey}}
    private static Pattern pattern = Pattern.compile("\\{\\{\\s*([^{}]+)\\s*}}");

    public static Set<String> extractMustacheKeys(String template) {
        if (template == null || template.isEmpty()) {
            return new HashSet<>();
        }

        Matcher matcher = pattern.matcher(template);

        if (matcher.groupCount() > 0) {
            Set<String> collect = matcher.results()
                    .map(result -> result.group(1))
                    .collect(Collectors.toSet());
            return collect;
        }
        return new HashSet<>();
    }

}
