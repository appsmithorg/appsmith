package com.appsmith.external.helpers;

import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

public class SmartSubstitutionHelper {

    public static final String APPSMITH_SUBSTITUTION_PLACEHOLDER = "#_appsmith_placeholder#";

    public static String replaceQuestionMarkWithDollarIndex(String query) {
        final AtomicInteger counter = new AtomicInteger();
        String updatedQuery = query.chars()
                .mapToObj(c -> {
                    if (c == '?') {
                        return "$" + counter.incrementAndGet();
                    }

                    return Character.toString(c);
                })
                .collect(Collectors.joining());

        return updatedQuery;
    }

}
