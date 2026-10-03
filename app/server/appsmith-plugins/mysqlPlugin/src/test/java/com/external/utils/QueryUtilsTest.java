package com.external.utils;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for {@link QueryUtils}.
 */
public class QueryUtilsTest {

    /**
     * Tests removing comments from an empty string.
     */
    @Test
    public void testRemoveQueryComments_emptyString_returnsEmptyString() {
        final String s = QueryUtils.removeQueryComments("");
        assertEquals("", s);
    }

    /**
     * Tests removing comments from a multiline query without comments.
     */
    @Test
    public void testRemoveQueryComments_multilineWithoutComments_returnsSameString() {
        final String query = "SELECT * \n FROM table;";
        final String s = QueryUtils.removeQueryComments(query);
        assertEquals(query, s);
    }

    /**
     * Tests removing comments when a line comment is on a separate line.
     */
    @Test
    public void testRemoveQueryComments_multilineWithCommentOnSeparateLine_returnsStringWithoutThatLine() {
        final String query = "SELECT * \n FROM table; \n -- comment";
        final String expected = "SELECT * \n FROM table;";
        final String s = QueryUtils.removeQueryComments(query);
        assertEquals(expected, s);
    }

    /**
     * Tests removing comments when comments are on the same line as SQL code.
     */
    @Test
    public void testRemoveQueryComments_multilineWithCommentOnSameLine_returnsStringWithoutComment() {
        final String query = "SELECT * --comment \n FROM table; -- comment \n";
        final String expected = "SELECT * \n FROM table;";
        final String s = QueryUtils.removeQueryComments(query);
        assertEquals(expected, s);
    }

    /**
     * Tests that comment keywords inside single quotes are preserved.
     */
    @Test
    public void testRemoveQueryComments_multilineWithCommentKeywordInString_returnsSameString() {
        final String query = "SELECT * \n FROM table WHERE id = '--';";
        final String expected = "SELECT * \n FROM table WHERE id = '--';";
        final String s = QueryUtils.removeQueryComments(query);
        assertEquals(expected, s);
    }

    /**
     * Tests that multiple statements separated by semicolons are preserved.
     */
    @Test
    public void testRemoveQueryComments_multilineWithMultiStatements_returnsSameString() {
        final String query = "SELECT * \n FROM table; SELECT * \n FROM table2;";
        final String expected = "SELECT * \n FROM table; SELECT * \n FROM table2;";
        final String s = QueryUtils.removeQueryComments(query);
        assertEquals(expected, s);
    }

    /**
     * Tests that standard SELECT statements are identified as row-returning queries.
     */
    @Test
    public void testIsRowReturningQuery_standardSelect_returnsTrue() {
        assertTrue(QueryUtils.isRowReturningQuery("SELECT * FROM employees;"));
        assertTrue(QueryUtils.isRowReturningQuery("select id from users where id = 1"));
        assertTrue(QueryUtils.isRowReturningQuery("  SELECT 1  "));
    }

    /**
     * Tests that SHOW, DESCRIBE, DESC, EXPLAIN, TABLE, and VALUES commands return true.
     */
    @Test
    public void testIsRowReturningQuery_showDescribeDescExplain_returnsTrue() {
        assertTrue(QueryUtils.isRowReturningQuery("SHOW DATABASES;"));
        assertTrue(QueryUtils.isRowReturningQuery("SHOW TABLES;"));
        assertTrue(QueryUtils.isRowReturningQuery("DESCRIBE users;"));
        assertTrue(QueryUtils.isRowReturningQuery("DESC users;"));
        assertTrue(QueryUtils.isRowReturningQuery("EXPLAIN SELECT * FROM users;"));
        assertTrue(QueryUtils.isRowReturningQuery("explain users;"));
        assertTrue(QueryUtils.isRowReturningQuery("TABLE employees;"));
        assertTrue(QueryUtils.isRowReturningQuery("VALUES ROW(1, 'a');"));
    }

    /**
     * Tests that parenthesized SELECT statements are identified as row-returning queries.
     */
    @Test
    public void testIsRowReturningQuery_parenthesizedSelect_returnsTrue() {
        assertTrue(QueryUtils.isRowReturningQuery("(SELECT * FROM employees);"));
        assertTrue(QueryUtils.isRowReturningQuery("((SELECT 1));"));
    }

    /**
     * Tests that data modification and DDL queries are identified as non-row-returning queries.
     */
    @Test
    public void testIsRowReturningQuery_mutationQueries_returnsFalse() {
        assertFalse(QueryUtils.isRowReturningQuery("INSERT INTO users (id) VALUES (1);"));
        assertFalse(QueryUtils.isRowReturningQuery("UPDATE users SET name = 'test' WHERE id = 1;"));
        assertFalse(QueryUtils.isRowReturningQuery("DELETE FROM users WHERE id = 1;"));
        assertFalse(QueryUtils.isRowReturningQuery("CREATE TABLE test (id INT);"));
        assertFalse(QueryUtils.isRowReturningQuery("DROP TABLE test;"));
        assertFalse(QueryUtils.isRowReturningQuery("ALTER TABLE test ADD COLUMN name VARCHAR(255);"));
        assertFalse(QueryUtils.isRowReturningQuery("SET @var = 1;"));
        assertFalse(QueryUtils.isRowReturningQuery("CALL my_procedure();"));
    }

    /**
     * Tests that a simple Common Table Expression (CTE) with SELECT returns true.
     */
    @Test
    public void testIsRowReturningQuery_simpleCteSelect_returnsTrue() {
        String query = "WITH cte_name AS (\n"
                + "    SELECT * FROM employees WHERE id = 1\n"
                + ")\n"
                + "SELECT * FROM cte_name;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a CTE with an explicit column list returns true.
     */
    @Test
    public void testIsRowReturningQuery_cteWithColumnList_returnsTrue() {
        String query = "WITH cte (id, full_name) AS (\n"
                + "    SELECT id, name FROM employees\n"
                + ")\n"
                + "SELECT * FROM cte;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a recursive CTE with RECURSIVE keyword returns true.
     */
    @Test
    public void testIsRowReturningQuery_recursiveCte_returnsTrue() {
        String query = "WITH RECURSIVE my_cte AS (\n"
                + "    SELECT 1 AS n\n"
                + "    UNION ALL\n"
                + "    SELECT n + 1 FROM my_cte WHERE n < 5\n"
                + ")\n"
                + "SELECT * FROM my_cte;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that multiple comma-separated CTE definitions return true.
     */
    @Test
    public void testIsRowReturningQuery_multipleCtes_returnsTrue() {
        String query = "WITH\n"
                + "    cte1 AS (SELECT 1 AS a),\n"
                + "    cte2 AS (SELECT 2 AS b)\n"
                + "SELECT * FROM cte1 JOIN cte2;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a CTE containing nested subqueries and string literals with parentheses and keywords returns true.
     */
    @Test
    public void testIsRowReturningQuery_cteWithStringsAndParens_returnsTrue() {
        String query = "WITH cte AS (\n"
                + "    SELECT id, 'nested (parens) and ; keywords' AS note\n"
                + "    FROM (SELECT 1 AS id) sub\n"
                + ")\n"
                + "SELECT * FROM cte;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a CTE containing a nested CTE returns true.
     */
    @Test
    public void testIsRowReturningQuery_cteWithNestedCte_returnsTrue() {
        String query = "WITH cte AS (\n"
                + "    WITH inner_cte AS (SELECT 1 AS x) SELECT * FROM inner_cte\n"
                + ")\n"
                + "SELECT * FROM cte;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a CTE with backtick-escaped identifier returns true.
     */
    @Test
    public void testIsRowReturningQuery_cteWithBackticks_returnsTrue() {
        String query = "WITH `my_cte` AS (\n"
                + "    SELECT 1 AS a\n"
                + ")\n"
                + "SELECT * FROM `my_cte`;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a CTE with comments before, inside, and after the CTE clauses returns true.
     */
    @Test
    public void testIsRowReturningQuery_cteWithComments_returnsTrue() {
        String query = "-- Pre-CTE comment\n"
                + "WITH cte AS (\n"
                + "    /* comment with parens ) and keywords SELECT */\n"
                + "    SELECT 1\n"
                + ")\n"
                + "-- Main query comment\n"
                + "SELECT * FROM cte;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a CTE followed by an UPDATE statement is recognized as a mutation (returns false).
     */
    @Test
    public void testIsRowReturningQuery_cteFollowedByUpdate_returnsFalse() {
        String query = "WITH cte AS (\n"
                + "    SELECT id FROM inactive_users\n"
                + ")\n"
                + "UPDATE users SET status = 0 WHERE id IN (SELECT id FROM cte);";
        assertFalse(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a CTE followed by a DELETE statement is recognized as a mutation (returns false).
     */
    @Test
    public void testIsRowReturningQuery_cteFollowedByDelete_returnsFalse() {
        String query = "WITH cte AS (\n"
                + "    SELECT id FROM inactive_users\n"
                + ")\n"
                + "DELETE FROM users WHERE id IN (SELECT id FROM cte);";
        assertFalse(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that EXPLAIN combined with CTE queries returns true.
     */
    @Test
    public void testIsRowReturningQuery_explainWithCte_returnsTrue() {
        String query = "EXPLAIN WITH cte AS (SELECT 1) SELECT * FROM cte;";
        assertTrue(QueryUtils.isRowReturningQuery(query));

        String query2 = "WITH cte AS (SELECT 1) EXPLAIN SELECT * FROM cte;";
        assertTrue(QueryUtils.isRowReturningQuery(query2));
    }

    /**
     * Tests that a CTE followed by a parenthesized SELECT statement returns true.
     */
    @Test
    public void testIsRowReturningQuery_cteWithParenthesizedSelect_returnsTrue() {
        String query = "WITH cte AS (SELECT 1) (SELECT * FROM cte);";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a multi-statement query ending in a CTE SELECT returns true.
     */
    @Test
    public void testIsRowReturningQuery_multiStatementEndingInCteSelect_returnsTrue() {
        String query = "SET @var = 1;\n"
                + "WITH cte AS (SELECT @var AS v) SELECT * FROM cte;";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that a multi-statement query ending in a mutation statement returns false.
     */
    @Test
    public void testIsRowReturningQuery_multiStatementEndingInUpdate_returnsFalse() {
        String query = "WITH cte AS (SELECT 1) SELECT * FROM cte;\n"
                + "UPDATE users SET active = 1;";
        assertFalse(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that semicolons inside string literals do not improperly split the statement.
     */
    @Test
    public void testIsRowReturningQuery_semicolonsInsideStringLiteral_returnsTrue() {
        String query = "SELECT * FROM users WHERE notes = 'first;second;third';";
        assertTrue(QueryUtils.isRowReturningQuery(query));
    }

    /**
     * Tests that trailing semicolons and whitespace do not invalidate a SELECT statement.
     */
    @Test
    public void testIsRowReturningQuery_trailingSemicolonsAndWhitespace_returnsTrue() {
        assertTrue(QueryUtils.isRowReturningQuery("SELECT * FROM users; ; \n\t"));
    }

    /**
     * Tests that queries prefixed by block comments or optimizer hints return true.
     */
    @Test
    public void testIsRowReturningQuery_blockCommentBeforeSelect_returnsTrue() {
        assertTrue(QueryUtils.isRowReturningQuery("/* block comment */ SELECT * FROM users;"));
        assertTrue(QueryUtils.isRowReturningQuery("/*+ BKA(t1) */ SELECT * FROM users;"));
        assertTrue(QueryUtils.isRowReturningQuery("# hash comment\nSELECT * FROM users;"));
    }

    /**
     * Tests that null, empty, or whitespace-only inputs return false.
     */
    @Test
    public void testIsRowReturningQuery_nullOrEmpty_returnsFalse() {
        assertFalse(QueryUtils.isRowReturningQuery(null));
        assertFalse(QueryUtils.isRowReturningQuery(""));
        assertFalse(QueryUtils.isRowReturningQuery("   \n\t "));
        assertFalse(QueryUtils.isRowReturningQuery("; ; ;"));
    }

    /**
     * Tests that splitMultiQueries properly splits multiple SQL statements while ignoring semicolons in quotes.
     */
    @Test
    public void testSplitMultiQueries_splitsProperly() {
        List<String> stmts = QueryUtils.splitMultiQueries("SELECT 1; UPDATE t SET a = 'foo;bar'; SELECT 2;");
        assertEquals(3, stmts.size());
        assertEquals("SELECT 1", stmts.get(0));
        assertEquals("UPDATE t SET a = 'foo;bar'", stmts.get(1));
        assertEquals("SELECT 2", stmts.get(2));
    }
}
