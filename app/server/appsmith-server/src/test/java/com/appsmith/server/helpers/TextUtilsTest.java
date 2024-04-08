package com.appsmith.server.helpers;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

public class TextUtilsTest {
    @Test
    public void makeSlug() {
        assertThat(TextUtils.makeSlug("Hello Darkness My Old Friend")).isEqualTo("hello-darkness-my-old-friend");
        assertThat(TextUtils.makeSlug("Page1")).isEqualTo("page1");
        assertThat(TextUtils.makeSlug("TestPage123")).isEqualTo("testpage123");
        assertThat(TextUtils.makeSlug("Page 1")).isEqualTo("page-1");
        assertThat(TextUtils.makeSlug(" Page 1 ")).isEqualTo("page-1");
        assertThat(TextUtils.makeSlug("Page  1")).isEqualTo("page-1");
        assertThat(TextUtils.makeSlug("_page 1")).isEqualTo("page-1");
        assertThat(TextUtils.makeSlug("!page 1")).isEqualTo("page-1");
        assertThat(TextUtils.makeSlug("page 1!")).isEqualTo("page-1");
        assertThat(TextUtils.makeSlug("page__1")).isEqualTo("page-1");
        assertThat(TextUtils.makeSlug("Hello (new)")).isEqualTo("hello-new");
        assertThat(TextUtils.makeSlug("")).isEqualTo("");
        assertThat(TextUtils.makeSlug(null)).isEqualTo("");
        // text is hindi
        assertThat(TextUtils.makeSlug("परीक्षण पृष्ठ")).isEqualTo("");
        // text is in spanish
        assertThat(TextUtils.makeSlug("página de prueba")).isEqualTo("pagina-de-prueba");
        // text in chinese
        assertThat(TextUtils.makeSlug("测试页")).isEqualTo("");
    }

    private void checkFromCsv(String inputString, int expectedSize, String... parts) {
        Set<String> s1 = TextUtils.csvToSet(inputString);
        assertThat(s1).hasSize(expectedSize);
        assertThat(s1).contains(parts);
    }

    @Test
    public void csvToSet() {
        checkFromCsv("a, b", 2, "a", "b");
        checkFromCsv("a, b,", 2, "a", "b");
        checkFromCsv("a, b, ", 2, "a", "b");
        checkFromCsv("a, b, ,c", 3, "a", "b", "c");
        checkFromCsv("a, b,,c", 3, "a", "b", "c");
        checkFromCsv("a,  b,  ,c ", 3, "a", "b", "c");
        checkFromCsv("a,b,,c ,d", 4, "a", "b", "c", "d");
        checkFromCsv("a,b c,", 2, "a", "b c");
        checkFromCsv("", 0);
        checkFromCsv(null, 0);
    }
}
