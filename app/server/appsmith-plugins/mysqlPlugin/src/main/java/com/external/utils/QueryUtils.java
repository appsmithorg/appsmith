package com.external.utils;

public class QueryUtils {

    /**
     * Parse through the input string to discard all comments from the query string.
     * This method will retain a substring if it is enclosed by quotes
     *
     * @param query
     * @return
     */
    public static String removeQueryComments(String query) {
        StringBuilder sb = new StringBuilder();
        final int length = query.length();
        int commentCharacterCount = 0;
        boolean inComment = false;
        boolean inSingleQuotes = false;
        boolean inDoubleQuotes = false;
        for (int i = 0; i < length; i++) {
            char current = query.charAt(i);
            if ('\'' == current) {
                inSingleQuotes = !inSingleQuotes;
            }
            if ('\n' == current) {
                inComment = false;
            }
            if ('"' == current) {
                inDoubleQuotes = !inDoubleQuotes;
            }
            if ('-' == current) {
                if (!inDoubleQuotes && !inSingleQuotes) {
                    commentCharacterCount++;
                }
            } else if (!inComment) {
                commentCharacterCount = 0;
            }
            if (commentCharacterCount == 2) {
                inComment = true;
                sb.deleteCharAt(sb.length() - 1);
                commentCharacterCount = 0;
            }
            if (!inComment) {
                sb.append(current);
            }
        }
        return sb.toString().trim();
    }

    /**
     * To remove Square braces if any in the query.
     * In a scenario like Multiselect widget, the params are passed as an array which carries a square bracket.
     * This method will fix it
     * @param query
     * @return
     */
    public static String removeSquareBraces(String query) {
        if (query.contains("[") || query.contains("]")) {
            query = query.replaceAll("\\[", "").replaceAll("\\]","");
        }
        return query;
    }

    /**
     * Add double quotes for params missing double quotes.
     * To handle where some widgets send data without double Quotes.
     * @param query
     * @return
     */
   public static String addDoubleQuotes(String query) {
        String retQuery = query;
        if (query.substring(0).equals("\"")) retQuery = query;

       retQuery = "\"" + query + "\"";

       return retQuery;
    }
}
