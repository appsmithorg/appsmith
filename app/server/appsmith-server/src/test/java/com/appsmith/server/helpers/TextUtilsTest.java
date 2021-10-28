package com.appsmith.server.helpers;

import org.junit.Test;

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
        assertThat(TextUtils.makeSlug("Hello (new)")).isEqualTo("hello-new");
        // text is hindi
        assertThat(TextUtils.makeSlug("परीक्षण पृष्ठ")).isEqualTo("");
        // text is in spanish
        assertThat(TextUtils.makeSlug("página de prueba")).isEqualTo("pagina-de-prueba");
        // text in chinese
        assertThat(TextUtils.makeSlug("测试页")).isEqualTo("");
    }
}