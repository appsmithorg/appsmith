package com.appsmith.server.helpers;

import org.junit.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class TextUtilsTest {
    @Test
    public void getSlug() {
        assertThat(TextUtils.getSlug("Hello Darkness My Old Friend")).isEqualTo("hello-darkness-my-old-friend");
        assertThat(TextUtils.getSlug("Page1")).isEqualTo("page1");
        assertThat(TextUtils.getSlug("TestPage123")).isEqualTo("testpage123");
        assertThat(TextUtils.getSlug("Page 1")).isEqualTo("page-1");
        assertThat(TextUtils.getSlug(" Page 1 ")).isEqualTo("page-1");
        assertThat(TextUtils.getSlug("Page  1")).isEqualTo("page--1");
    }
}