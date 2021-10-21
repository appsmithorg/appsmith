package com.appsmith.server.helpers;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public class TextUtils {
    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    /**
     * Creates a slug from the inputText and returns it
     * @param inputText String that'll be converted to slug
     * @return String in the slug format
     */
    public static String getSlug(String inputText) {
        String nowhitespace = WHITESPACE.matcher(inputText.trim()).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
