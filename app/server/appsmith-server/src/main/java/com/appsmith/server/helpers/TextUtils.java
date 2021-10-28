package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

@Slf4j
public class TextUtils {
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    /**
     * Creates a human readable URL safe text from the input text. It considers the following:
     * (1) It removes heading and trailing whitespaces and replace any other whitespace with `-`
     * (2) If the input is in ascii, it converts to lowercase
     * (3) If the input is unicode, it becomes URL encoded string
     * Modern browsers displays the URL encoded string in decoded format so the URL will look clean i.e. no % symbols will be visible
     * @param inputText String that'll be converted
     * @return String, empty if failed due to encoding exception
     */
    public static String toUrlSafeHumanReadableText(String inputText) {
        String nowhitespaceInLowecase = WHITESPACE.matcher(inputText.trim()).replaceAll("-").toLowerCase();
        try{
            return URLEncoder.encode(nowhitespaceInLowecase, StandardCharsets.UTF_8.toString());
        } catch (UnsupportedEncodingException ex) {
            log.error("failed to create slug from " + inputText, ex);
            return "";
        }
    }
}
