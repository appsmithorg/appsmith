package com.appsmith.server.constants;

public class PatternConstants {

    /**
     * Valid Website Patterns:
     * - https://www.valid.website.com
     * - http://www.valid.website.com
     * - https://valid.website.com
     * - http://valid.website.com
     * - www.valid.website.com
     * - valid.website.com
     * - valid-website.com
     * - valid.12345.com
     * - 12345.com
     * <p>
     * Invalid Website Patterns:
     * - htp://www.invalid.website.com
     * - htp://invalid.website.com
     * - htp://www
     * - www
     * - www.
     */
    public final static String WEBSITE_PATTERN = "^(http://|https://)?(www.)?(([a-z0-9\\-]+)\\.)+([a-z]+)(/)?$";
    /**
     * Valid Email Patterns:
     * - valid@email.com
     * - valid@email.co.in
     * - valid@email-assoc.co.in
     * Invalid Email Patterns:
     * - invalid@.com
     * - @invalid.com
     */
    public final static String EMAIL_PATTERN = "^(?=.{1,64}@)[A-Za-z0-9_-]+(\\.[A-Za-z0-9_-]+)*@"
            + "[^-][A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*(\\.[A-Za-z]{2,})$";

    // This constant can be used to String to a string which starts with `^` and ends with `$`
    // Example: Using String.format() on any string:
    // 1. sample -> ^sample$
    // 2. SAMPLE -> ^SAMPLE$
    // 3. Sample -> ^Sample$
    public static final String STRING_WITH_START_END = "^%s$";
    // This constant can be used in places where we want to convert a string to regex group
    // For example: (^test$)|(^test1$) can be used to match with either test or test1
    // Regex patterns such as (^test1$)|(^test2$)|(^test3$) will match with any of the strings -> test1, test2, test3
    public static final String GROUPED_STRING_WITH_START_END = "(" + STRING_WITH_START_END + ")";
    public static final String REGEX_OR_SEPARATOR = "|";
}
