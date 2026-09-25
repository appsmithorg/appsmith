package com.external.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Utility methods for parsing and analyzing SQL queries for the MySQL plugin.
 */
public class QueryUtils {

    private static final Set<String> ROW_RETURNING_KEYWORDS = Set.of(
            "select",
            "show",
            "describe",
            "desc",
            "explain",
            "table",
            "values"
    );

    private static final Set<String> MUTATION_KEYWORDS = Set.of(
            "update",
            "delete",
            "insert",
            "create",
            "drop",
            "alter",
            "truncate",
            "rename",
            "replace",
            "set",
            "grant",
            "revoke",
            "lock",
            "unlock",
            "call"
    );

    /**
     * Parse through the input string to discard all comments from the query string.
     * This method will retain a substring if it is enclosed by quotes
     *
     * @param query the SQL query string
     * @return query string with line comments removed
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
     * Determines whether the given SQL query (or the last query in a multi-statement sequence)
     * is a row-returning query such as SELECT, SHOW, DESCRIBE, EXPLAIN, TABLE, VALUES,
     * or a Common Table Expression (WITH ... SELECT ...).
     *
     * @param query the SQL query string to inspect
     * @return true if the query returns rows, false otherwise
     */
    public static boolean isRowReturningQuery(String query) {
        if (query == null || query.isBlank()) {
            return false;
        }

        List<String> statements = splitMultiQueries(query);
        if (statements.isEmpty()) {
            return false;
        }

        String targetStatement = statements.get(statements.size() - 1);
        return isStatementRowReturning(targetStatement);
    }

    /**
     * Splits a SQL script into individual statements separated by semicolons,
     * ignoring semicolons inside quotes, backticks, or comments.
     *
     * @param sql the SQL string containing one or more statements
     * @return a list of non-empty SQL statements
     */
    public static List<String> splitMultiQueries(String sql) {
        List<String> statements = new ArrayList<>();
        if (sql == null || sql.isBlank()) {
            return statements;
        }

        StringBuilder current = new StringBuilder();
        int len = sql.length();
        boolean inSingleQuotes = false;
        boolean inDoubleQuotes = false;
        boolean inBackticks = false;
        boolean inLineComment = false;
        boolean inBlockComment = false;

        for (int i = 0; i < len; i++) {
            char c = sql.charAt(i);
            char next = (i + 1 < len) ? sql.charAt(i + 1) : '\0';

            // Handle line comments (-- or #)
            if (inLineComment) {
                if (c == '\n' || c == '\r') {
                    inLineComment = false;
                }
                current.append(c);
                continue;
            }

            // Handle block comments (/* ... */)
            if (inBlockComment) {
                if (c == '*' && next == '/') {
                    inBlockComment = false;
                    current.append(c);
                    current.append(next);
                    i++;
                    continue;
                }
                current.append(c);
                continue;
            }

            // Handle single quotes
            if (inSingleQuotes) {
                if (c == '\\') {
                    current.append(c);
                    if (i + 1 < len) {
                        i++;
                        current.append(sql.charAt(i));
                    }
                    continue;
                }
                if (c == '\'') {
                    if (next == '\'') {
                        current.append(c);
                        current.append(next);
                        i++;
                        continue;
                    }
                    inSingleQuotes = false;
                }
                current.append(c);
                continue;
            }

            // Handle double quotes
            if (inDoubleQuotes) {
                if (c == '\\') {
                    current.append(c);
                    if (i + 1 < len) {
                        i++;
                        current.append(sql.charAt(i));
                    }
                    continue;
                }
                if (c == '"') {
                    if (next == '"') {
                        current.append(c);
                        current.append(next);
                        i++;
                        continue;
                    }
                    inDoubleQuotes = false;
                }
                current.append(c);
                continue;
            }

            // Handle backticks
            if (inBackticks) {
                if (c == '`') {
                    if (next == '`') {
                        current.append(c);
                        current.append(next);
                        i++;
                        continue;
                    }
                    inBackticks = false;
                }
                current.append(c);
                continue;
            }

            // Detect comment starts
            if (c == '-' && next == '-') {
                inLineComment = true;
                current.append(c);
                current.append(next);
                i++;
                continue;
            }
            if (c == '#') {
                inLineComment = true;
                current.append(c);
                continue;
            }
            if (c == '/' && next == '*') {
                inBlockComment = true;
                current.append(c);
                current.append(next);
                i++;
                continue;
            }

            // Detect quote starts
            if (c == '\'') {
                inSingleQuotes = true;
                current.append(c);
                continue;
            }
            if (c == '"') {
                inDoubleQuotes = true;
                current.append(c);
                continue;
            }
            if (c == '`') {
                inBackticks = true;
                current.append(c);
                continue;
            }

            // Statement delimiter
            if (c == ';') {
                String stmt = current.toString().trim();
                if (!stmt.isEmpty()) {
                    statements.add(stmt);
                }
                current.setLength(0);
                continue;
            }

            current.append(c);
        }

        String lastStmt = current.toString().trim();
        if (!lastStmt.isEmpty()) {
            statements.add(lastStmt);
        }

        return statements;
    }

    /**
     * Determines whether an individual SQL statement is row-returning.
     *
     * @param stmt the SQL statement string
     * @return true if the statement returns rows, false otherwise
     */
    private static boolean isStatementRowReturning(String stmt) {
        int index = skipWhitespaceAndComments(stmt, 0);

        // Skip optional leading parenthesis, e.g. (SELECT 1)
        while (index < stmt.length() && stmt.charAt(index) == '(') {
            index = skipWhitespaceAndComments(stmt, index + 1);
        }

        String firstKeyword = readNextKeyword(stmt, index);
        if (firstKeyword == null) {
            return false;
        }

        if (ROW_RETURNING_KEYWORDS.contains(firstKeyword)) {
            return true;
        }

        if ("with".equals(firstKeyword)) {
            return isCteRowReturning(stmt, index + 4);
        }

        return false;
    }

    /**
     * Inspects a Common Table Expression (CTE) statement to determine whether the
     * executed main statement is row-returning (e.g. WITH ... SELECT ...) or a mutation
     * (e.g. WITH ... UPDATE ...).
     *
     * @param stmt the SQL statement string
     * @param startIndex the index right after the "WITH" keyword
     * @return true if the CTE returns rows, false if it is a mutation query
     */
    private static boolean isCteRowReturning(String stmt, int startIndex) {
        int index = skipWhitespaceAndComments(stmt, startIndex);

        // Check for optional RECURSIVE keyword
        String nextKeyword = readNextKeyword(stmt, index);
        if ("recursive".equalsIgnoreCase(nextKeyword)) {
            index = skipWhitespaceAndComments(stmt, index + nextKeyword.length());
        }

        // Loop through CTE definitions: cte_name [(cols)] AS (subquery) [, cte_name2 ...]
        while (index < stmt.length()) {
            // Skip CTE name
            index = skipIdentifier(stmt, index);
            index = skipWhitespaceAndComments(stmt, index);

            if (index >= stmt.length()) {
                return true; // Malformed CTE, fallback to row-returning
            }

            // Check for optional column list: (col1, col2, ...)
            if (stmt.charAt(index) == '(') {
                index = skipBalancedParentheses(stmt, index);
                index = skipWhitespaceAndComments(stmt, index);
            }

            if (index >= stmt.length()) {
                return true;
            }

            // Expect AS keyword
            String asKeyword = readNextKeyword(stmt, index);
            if ("as".equalsIgnoreCase(asKeyword)) {
                index = skipWhitespaceAndComments(stmt, index + asKeyword.length());
            }

            if (index >= stmt.length()) {
                return true;
            }

            // Expect opening parenthesis '(' of the CTE subquery
            if (stmt.charAt(index) == '(') {
                index = skipBalancedParentheses(stmt, index);
                index = skipWhitespaceAndComments(stmt, index);
            } else {
                return true;
            }

            // After closing ')', check if there is a comma ',' indicating another CTE definition
            if (index < stmt.length() && stmt.charAt(index) == ',') {
                index = skipWhitespaceAndComments(stmt, index + 1);
            } else {
                // No comma, CTE definitions finished. The main statement begins here.
                break;
            }
        }

        // We are now at the main statement following the CTE clauses
        index = skipWhitespaceAndComments(stmt, index);

        // Skip optional leading parenthesis on main statement, e.g. (SELECT ...)
        while (index < stmt.length() && stmt.charAt(index) == '(') {
            index = skipWhitespaceAndComments(stmt, index + 1);
        }

        String mainKeyword = readNextKeyword(stmt, index);
        if (mainKeyword == null) {
            return true;
        }

        if (ROW_RETURNING_KEYWORDS.contains(mainKeyword)) {
            return true;
        }

        if (MUTATION_KEYWORDS.contains(mainKeyword)) {
            return false;
        }

        // Default fallback for CTE queries is row-returning
        return true;
    }

    /**
     * Skips an SQL identifier (unquoted, backtick-quoted, or double-quoted).
     *
     * @param stmt the SQL statement string
     * @param index the start index of the identifier
     * @return index after the identifier
     */
    private static int skipIdentifier(String stmt, int index) {
        if (index >= stmt.length()) {
            return index;
        }
        char c = stmt.charAt(index);
        if (c == '`') {
            index++;
            while (index < stmt.length()) {
                if (stmt.charAt(index) == '`') {
                    if (index + 1 < stmt.length() && stmt.charAt(index + 1) == '`') {
                        index += 2;
                        continue;
                    }
                    index++;
                    break;
                }
                index++;
            }
            return index;
        }
        if (c == '"') {
            index++;
            while (index < stmt.length()) {
                if (stmt.charAt(index) == '"') {
                    if (index + 1 < stmt.length() && stmt.charAt(index + 1) == '"') {
                        index += 2;
                        continue;
                    }
                    index++;
                    break;
                }
                index++;
            }
            return index;
        }
        // Unquoted identifier: letters, digits, underscore, dollar sign
        while (index < stmt.length()) {
            char ch = stmt.charAt(index);
            if (Character.isLetterOrDigit(ch) || ch == '_' || ch == '$') {
                index++;
            } else {
                break;
            }
        }
        return index;
    }

    /**
     * Advances index past balanced parentheses, starting at an opening parenthesis '('.
     * Correctly handles quotes, backticks, and comments within the parentheses.
     *
     * @param stmt the SQL statement string
     * @param openParenIndex index of the opening parenthesis '('
     * @return index immediately after the matching closing parenthesis ')'
     */
    private static int skipBalancedParentheses(String stmt, int openParenIndex) {
        int depth = 0;
        int len = stmt.length();
        int i = openParenIndex;

        while (i < len) {
            char c = stmt.charAt(i);
            char next = (i + 1 < len) ? stmt.charAt(i + 1) : '\0';

            // Check single quotes
            if (c == '\'') {
                i++;
                while (i < len) {
                    char sc = stmt.charAt(i);
                    if (sc == '\\') {
                        i += 2;
                        continue;
                    }
                    if (sc == '\'') {
                        if (i + 1 < len && stmt.charAt(i + 1) == '\'') {
                            i += 2;
                            continue;
                        }
                        i++;
                        break;
                    }
                    i++;
                }
                continue;
            }

            // Check double quotes
            if (c == '"') {
                i++;
                while (i < len) {
                    char sc = stmt.charAt(i);
                    if (sc == '\\') {
                        i += 2;
                        continue;
                    }
                    if (sc == '"') {
                        if (i + 1 < len && stmt.charAt(i + 1) == '"') {
                            i += 2;
                            continue;
                        }
                        i++;
                        break;
                    }
                    i++;
                }
                continue;
            }

            // Check backticks
            if (c == '`') {
                i++;
                while (i < len) {
                    if (stmt.charAt(i) == '`') {
                        if (i + 1 < len && stmt.charAt(i + 1) == '`') {
                            i += 2;
                            continue;
                        }
                        i++;
                        break;
                    }
                    i++;
                }
                continue;
            }

            // Check line comments: -- or #
            if (c == '-' && next == '-') {
                i += 2;
                while (i < len && stmt.charAt(i) != '\n' && stmt.charAt(i) != '\r') {
                    i++;
                }
                continue;
            }
            if (c == '#') {
                i++;
                while (i < len && stmt.charAt(i) != '\n' && stmt.charAt(i) != '\r') {
                    i++;
                }
                continue;
            }

            // Check block comments: /* ... */
            if (c == '/' && next == '*') {
                i += 2;
                while (i < len - 1) {
                    if (stmt.charAt(i) == '*' && stmt.charAt(i + 1) == '/') {
                        i += 2;
                        break;
                    }
                    i++;
                }
                continue;
            }

            // Parentheses tracking
            if (c == '(') {
                depth++;
            } else if (c == ')') {
                depth--;
                if (depth == 0) {
                    return i + 1;
                }
            }

            i++;
        }

        return i;
    }

    /**
     * Skips whitespace, line comments, and block comments starting from the specified index.
     *
     * @param stmt the SQL statement string
     * @param index starting index
     * @return index of the first character that is not whitespace or comment
     */
    private static int skipWhitespaceAndComments(String stmt, int index) {
        int len = stmt.length();
        while (index < len) {
            char c = stmt.charAt(index);
            char next = (index + 1 < len) ? stmt.charAt(index + 1) : '\0';

            if (Character.isWhitespace(c)) {
                index++;
                continue;
            }

            // Line comment: --
            if (c == '-' && next == '-') {
                index += 2;
                while (index < len && stmt.charAt(index) != '\n' && stmt.charAt(index) != '\r') {
                    index++;
                }
                continue;
            }

            // Line comment: #
            if (c == '#') {
                index++;
                while (index < len && stmt.charAt(index) != '\n' && stmt.charAt(index) != '\r') {
                    index++;
                }
                continue;
            }

            // Block comment: /* ... */
            if (c == '/' && next == '*') {
                index += 2;
                while (index < len - 1) {
                    if (stmt.charAt(index) == '*' && stmt.charAt(index + 1) == '/') {
                        index += 2;
                        break;
                    }
                    index++;
                }
                continue;
            }

            break;
        }
        return index;
    }

    /**
     * Reads the next alphabetic keyword starting at index.
     *
     * @param stmt the SQL statement string
     * @param index starting index
     * @return the keyword in lowercase, or null if no alphabetic word found
     */
    private static String readNextKeyword(String stmt, int index) {
        if (index >= stmt.length()) {
            return null;
        }
        int start = index;
        while (index < stmt.length() && Character.isLetter(stmt.charAt(index))) {
            index++;
        }
        if (index == start) {
            return null;
        }
        return stmt.substring(start, index).toLowerCase();
    }
}
