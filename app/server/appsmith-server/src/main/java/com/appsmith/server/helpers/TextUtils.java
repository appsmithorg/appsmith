package com.appsmith.server.helpers;

import lombok.extern.slf4j.Slf4j;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Slf4j
public class TextUtils {
    /*
    * NON_LATIN regex matches any letter that is not a ASCII i.e. A-Za-z0-9, `-` and `_`
    * It'll match the unicode letters.
    * */
    private static final Pattern NON_LATIN = Pattern.compile("[^\\w_-]");

    /*
    * The SEPARATORS pattern matches those characters which cane be replaced with `-`
    * This includes Punctuation characters, `&`, space and not `-` itself. Details on `Punct`
    * http://www.gnu.org/software/grep/manual/html_node/Character-Classes-and-Bracket-Expressions.html
    * */
    private static final Pattern SEPARATORS = Pattern.compile("[\\s\\p{Punct}&&[^-]]");

    /**
     * Creates URL safe text aka slug from the input text. It supports english locale only.
     * See the test cases for sample conversions
     * For other languages, it'll return empty.
     * @param inputText String that'll be converted
     * @return String, empty if failed due to encoding exception
     */
    public static String makeSlug(String inputText) {
        if(inputText == null) {
            return "";
        }
        // remove all the separators with a `-`
        String noseparators = SEPARATORS.matcher(inputText).replaceAll("-");
        String normalized = Normalizer.normalize(noseparators, Normalizer.Form.NFD);

        // remove any non ascii letter with empty
        String slug = NON_LATIN.matcher(normalized).replaceAll("");
        // convert to lower case, remove multiple consecutive `-` with single `-`
        // if we've only `-` left and nothing else, replace it with empty string
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-{2,}","-").replaceAll("^-|-$","");
    }
}
