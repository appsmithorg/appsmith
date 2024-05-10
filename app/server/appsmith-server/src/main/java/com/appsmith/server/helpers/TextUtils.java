package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
public class TextUtils {
    /*
     * NON_LATIN regex matches any letter that is not a ASCII i.e. A-Za-z0-9, `-` and `_`
     * It'll match the unicode letters.
     * */
    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");

    /**
     * The SEPARATORS pattern matches those characters which will be replaced with `-`. This includes spaces and
     * punctuation characters.
     * <a href="https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/regex/Pattern.html#posix">Details on {@code Punct}</a>.
     */
    private static final Pattern SEPARATORS = Pattern.compile("[\\s\\p{Punct}]+");

    /**
     * Creates URL safe text aka slug from the input text. It supports english locale only.
     * See the test cases for sample conversions
     * For other languages, it'll return empty.
     *
     * @param inputText String that'll be converted
     * @return String, empty if failed due to encoding exception
     */
    public static String makeSlug(String inputText) {
        if (inputText == null) {
            return "";
        }

        // Replace all spaces and punctuation with a `-`.
        String noseparators = SEPARATORS.matcher(inputText).replaceAll("-");
        String normalized = Normalizer.normalize(noseparators, Normalizer.Form.NFD);

        // remove any non ascii letter with empty
        String slug = NON_LATIN.matcher(normalized).replaceAll("");
        // convert to lower case, remove multiple consecutive `-` with single `-`
        // if we've only `-` left and nothing else, replace it with empty string
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
    }

    /**
     * Splits a csv string and returns the parts as a set.
     * If comma has one or more spaces before and after, it'll ignore the spaces.
     *
     * @param inputStringCsv csv string
     * @return Set of string containing the parts of the csv
     */
    public static Set<String> csvToSet(String inputStringCsv) {
        if (inputStringCsv == null) {
            return Set.of();
        }
        Set<String> parts = new HashSet<>(Arrays.asList(inputStringCsv.trim().split("(\\s*,\\s*)+")));
        parts.remove("");
        return parts;
    }

    /**
     * Generates default names for roles based on role type and resource name.
     *
     * @param roleType     {@link String}
     * @param resourceName {@link String}
     * @return {@link String}
     */
    public static String generateDefaultRoleNameForResource(String roleType, String resourceName) {
        return roleType + " - " + resourceName;
    }
}
