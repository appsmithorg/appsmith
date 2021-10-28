package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Slf4j
public class TextUtils {
    private static final Pattern NONLATIN = Pattern.compile("[^\\w_-]");
    private static final Pattern SEPARATORS = Pattern.compile("[\\s\\p{Punct}&&[^-]]");
    /**
     * Creates URL safe text aka slug from the input text. It supports english locale only.
     * For other languages, it'll return empty.
     * @param inputText String that'll be converted
     * @return String, empty if failed due to encoding exception
     */
    public static String makeSlug(String inputText) {
        if(inputText == null) {
            return "";
        }
        String noseparators = SEPARATORS.matcher(inputText).replaceAll("-");
        String normalized = Normalizer.normalize(noseparators, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-{2,}","-").replaceAll("^-|-$","");
    }
}
