package com.external.utils;

import org.junit.Assert;
import org.junit.Test;

public class QueryUtilsTest {

    @Test
    public void testRemoveQueryComments_emptyString_returnsEmptyString() {
        final String s = QueryUtils.removeQueryComments("");
        Assert.assertEquals("", s);
    }

    @Test
    public void testRemoveQueryComments_multilineWithoutComments_returnsSameString() {
        final String query = "SELECT * \n FROM table;";
        final String s = QueryUtils.removeQueryComments(query);
        Assert.assertEquals(query, s);
    }

    @Test
    public void testRemoveQueryComments_multilineWithCommentOnSeparateLine_returnsStringWithoutThatLine() {
        final String query = "SELECT * \n FROM table; \n -- comment";
        final String expected = "SELECT * \n FROM table;";
        final String s = QueryUtils.removeQueryComments(query);
        Assert.assertEquals(expected, s);
    }

    @Test
    public void testRemoveQueryComments_multilineWithCommentOnSameLine_returnsStringWithoutComment() {
        final String query = "SELECT * --comment \n FROM table; -- comment \n";
        final String expected = "SELECT * \n FROM table;";
        final String s = QueryUtils.removeQueryComments(query);
        Assert.assertEquals(expected, s);
    }

    @Test
    public void testRemoveQueryComments_multilineWithCommentKeywordInString_returnsSameString() {
        final String query = "SELECT * \n FROM table WHERE id = '--';";
        final String expected = "SELECT * \n FROM table WHERE id = '--';";
        final String s = QueryUtils.removeQueryComments(query);
        Assert.assertEquals(expected, s);
    }

    @Test
    public void testRemoveQueryComments_multilineWithMultiStatements_returnsSameString() {
        final String query = "SELECT * \n FROM table; SELECT * \n FROM table2;";
        final String expected = "SELECT * \n FROM table; SELECT * \n FROM table2;";
        final String s = QueryUtils.removeQueryComments(query);
        Assert.assertEquals(expected, s);
    }
}