package com.external.plugins;

import com.external.plugins.utils.OracleExecuteUtils;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for {@link OracleExecuteUtils}, verifying query semicolon removal
 * and PL/SQL block detection.
 */
public class OracleExecuteUtilsTest {

    /**
     * Tests that removeSemicolonFromQuery returns null when given null input.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withNull_returnsNull() {
        assertNull(OracleExecuteUtils.removeSemicolonFromQuery(null));
    }

    /**
     * Tests that removeSemicolonFromQuery returns empty string when given empty string.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withEmptyString_returnsEmptyString() {
        assertEquals("", OracleExecuteUtils.removeSemicolonFromQuery(""));
    }

    /**
     * Tests that a plain query without any semicolon remains unchanged.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withoutSemicolon_remainsUnchanged() {
        String query = "SELECT * FROM employees WHERE department_id = 10";
        assertEquals(query, OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that a trailing semicolon at the end of the query is removed.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withTrailingSemicolon_removesSemicolon() {
        String query = "SELECT * FROM employees;";
        assertEquals("SELECT * FROM employees", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that multiple trailing semicolons are all removed.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withMultipleTrailingSemicolons_removesAllSemicolons() {
        String query = "SELECT * FROM employees;;;";
        assertEquals("SELECT * FROM employees", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that trailing semicolon followed by whitespace is removed while preserving whitespace.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withTrailingSemicolonAndWhitespace_removesSemicolon() {
        String query = "SELECT * FROM employees;  \n";
        assertEquals("SELECT * FROM employees  \n", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that semicolons inside a single-quoted string literal are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withSemicolonInStringLiteral_preservesSemicolon() {
        String query = "INSERT INTO logs (message) VALUES ('Error; check connection')";
        assertEquals(query, OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that semicolons inside string literal are preserved while trailing semicolon is removed.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withSemicolonInStringAndTrailingSemicolon_preservesStringAndRemovesTrailing() {
        String query = "INSERT INTO logs (message) VALUES ('Error; check connection');";
        assertEquals(
                "INSERT INTO logs (message) VALUES ('Error; check connection')",
                OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that multiple string literals containing semicolons are all preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withMultipleStringsContainingSemicolons_preservesAll() {
        String query = "SELECT * FROM t WHERE col1 = 'val;1' AND col2 = 'val;2';";
        assertEquals(
                "SELECT * FROM t WHERE col1 = 'val;1' AND col2 = 'val;2'",
                OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that string literals with escaped single quotes and semicolons are properly handled.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withEscapedSingleQuoteInString_preservesSemicolon() {
        String query = "SELECT * FROM t WHERE note = 'it''s a note; with semicolon';";
        assertEquals(
                "SELECT * FROM t WHERE note = 'it''s a note; with semicolon'",
                OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that semicolons inside double-quoted identifiers are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withSemicolonInDoubleQuotedIdentifier_preservesSemicolon() {
        String query = "SELECT \"column;name\" FROM \"my;table\";";
        assertEquals("SELECT \"column;name\" FROM \"my;table\"", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that double-quoted identifiers with escaped double quotes and semicolons are properly handled.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withEscapedDoubleQuoteInIdentifier_preservesSemicolon() {
        String query = "SELECT \"col\"\"name;extra\" FROM dual;";
        assertEquals("SELECT \"col\"\"name;extra\" FROM dual", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that semicolons inside line comments (-- ...) are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withSemicolonInLineComment_preservesSemicolon() {
        String query = "SELECT * FROM employees -- comment; here\nWHERE id = 1;";
        assertEquals(
                "SELECT * FROM employees -- comment; here\nWHERE id = 1",
                OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that semicolons inside block comments (/* ... * /) are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withSemicolonInBlockComment_preservesSemicolon() {
        String query = "SELECT /* hint; block comment */ * FROM employees;";
        assertEquals(
                "SELECT /* hint; block comment */ * FROM employees",
                OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that Oracle Q-quote string literals (e.g. q'[...]') with semicolons are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withOracleQQuoteLiteral_preservesSemicolon() {
        String query = "SELECT q'[first; second; third]' FROM dual;";
        assertEquals(
                "SELECT q'[first; second; third]' FROM dual", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that Oracle Q-quote literals with parenthesis delimiters (e.g. q'(...)') with semicolons are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withOracleQQuoteParenthesis_preservesSemicolon() {
        String query = "SELECT q'(text; with; semicolon)' FROM dual;";
        assertEquals(
                "SELECT q'(text; with; semicolon)' FROM dual", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that Oracle Q-quote literals with brace delimiters (e.g. q'{...}') with semicolons are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withOracleQQuoteBraces_preservesSemicolon() {
        String query = "SELECT Q'{text; with; semicolon}' FROM dual;";
        assertEquals(
                "SELECT Q'{text; with; semicolon}' FROM dual", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that Oracle Q-quote literals with angle bracket delimiters (e.g. q'<...>') with semicolons are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withOracleQQuoteAngleBrackets_preservesSemicolon() {
        String query = "SELECT q'<text; with; semicolon>' FROM dual;";
        assertEquals(
                "SELECT q'<text; with; semicolon>' FROM dual", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that Oracle Q-quote literals with custom character delimiters (e.g. q'#...#') with semicolons are preserved.
     */
    @Test
    public void testRemoveSemicolonFromQuery_withOracleQQuoteCustomDelimiter_preservesSemicolon() {
        String query = "SELECT q'#text; with; semicolon#' FROM dual;";
        assertEquals(
                "SELECT q'#text; with; semicolon#' FROM dual", OracleExecuteUtils.removeSemicolonFromQuery(query));
    }

    /**
     * Tests that isPLSQL returns false for null input.
     */
    @Test
    public void testIsPLSQL_withNull_returnsFalse() {
        assertFalse(OracleExecuteUtils.isPLSQL(null));
    }

    /**
     * Tests that isPLSQL returns false for standard SELECT query.
     */
    @Test
    public void testIsPLSQL_withSelectQuery_returnsFalse() {
        assertFalse(OracleExecuteUtils.isPLSQL("SELECT * FROM employees WHERE id = 1"));
    }

    /**
     * Tests that isPLSQL returns true for DECLARE block.
     */
    @Test
    public void testIsPLSQL_withDeclareBlock_returnsTrue() {
        String plsql = "DECLARE v_name VARCHAR2(50); BEGIN SELECT name INTO v_name FROM users WHERE id = 1; END;";
        assertTrue(OracleExecuteUtils.isPLSQL(plsql));
    }

    /**
     * Tests that isPLSQL returns true for BEGIN ... END block.
     */
    @Test
    public void testIsPLSQL_withBeginEndBlock_returnsTrue() {
        String plsql = "BEGIN UPDATE users SET active = 1 WHERE id = 1; END;";
        assertTrue(OracleExecuteUtils.isPLSQL(plsql));
    }

    /**
     * Tests that isPLSQL returns true for EXCEPTION block.
     */
    @Test
    public void testIsPLSQL_withExceptionBlock_returnsTrue() {
        String plsql = "BEGIN NULL; EXCEPTION WHEN OTHERS THEN NULL; END;";
        assertTrue(OracleExecuteUtils.isPLSQL(plsql));
    }

    /**
     * Tests that isPLSQL returns true for lowercase begin end block.
     */
    @Test
    public void testIsPLSQL_withLowercaseKeywords_returnsTrue() {
        String plsql = "begin null; end;";
        assertTrue(OracleExecuteUtils.isPLSQL(plsql));
    }
}
