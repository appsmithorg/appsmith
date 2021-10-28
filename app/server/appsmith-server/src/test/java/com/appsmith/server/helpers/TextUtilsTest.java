package com.appsmith.server.helpers;

import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class TextUtilsTest {
    @Test
    public void toUrlSafeHumanReadableText() {
        assertThat(TextUtils.toUrlSafeHumanReadableText("Hello Darkness My Old Friend")).isEqualTo("hello-darkness-my-old-friend");
        assertThat(TextUtils.toUrlSafeHumanReadableText("Page1")).isEqualTo("page1");
        assertThat(TextUtils.toUrlSafeHumanReadableText("TestPage123")).isEqualTo("testpage123");
        assertThat(TextUtils.toUrlSafeHumanReadableText("Page 1")).isEqualTo("page-1");
        assertThat(TextUtils.toUrlSafeHumanReadableText(" Page 1 ")).isEqualTo("page-1");
        assertThat(TextUtils.toUrlSafeHumanReadableText("Page  1")).isEqualTo("page--1");
        assertThat(TextUtils.toUrlSafeHumanReadableText("_page 1")).isEqualTo("_page-1");
        assertThat(TextUtils.toUrlSafeHumanReadableText("_page 1")).isEqualTo("_page-1");
        assertThat(TextUtils.toUrlSafeHumanReadableText("Hello (new)")).isEqualTo("hello-%28new%29");
        // text is hindi
        assertThat(TextUtils.toUrlSafeHumanReadableText("परीक्षण पृष्ठ")).isEqualTo("%E0%A4%AA%E0%A4%B0%E0%A5%80%E0%A4%95%E0%A5%8D%E0%A4%B7%E0%A4%A3-%E0%A4%AA%E0%A5%83%E0%A4%B7%E0%A5%8D%E0%A4%A0");
        // text is in spanish
        assertThat(TextUtils.toUrlSafeHumanReadableText("página de prueba")).isEqualTo("p%C3%A1gina-de-prueba");
        // text in chinese
        assertThat(TextUtils.toUrlSafeHumanReadableText("测试页")).isEqualTo("%E6%B5%8B%E8%AF%95%E9%A1%B5");
    }
}