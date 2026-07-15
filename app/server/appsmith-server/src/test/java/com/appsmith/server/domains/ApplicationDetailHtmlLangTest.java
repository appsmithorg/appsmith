package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.ApplicationDetailCE;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

public class ApplicationDetailHtmlLangTest {

    private String normalized(String input) {
        ApplicationDetail detail = new ApplicationDetail();
        detail.setHtmlLang(input);
        return detail.getHtmlLang();
    }

    @Test
    public void setHtmlLang_trimsAndLowercasesValidTag() {
        assertThat(normalized("  DE ")).isEqualTo("de");
        assertThat(normalized("fr-CA")).isEqualTo("fr-ca");
        assertThat(normalized("en")).isEqualTo("en");
        assertThat(normalized("zh-Hans-CN")).isEqualTo("zh-hans-cn");
    }

    @Test
    public void setHtmlLang_dropsInvalidValues() {
        // Invalid non-empty values are treated as absent (null) so they can't clobber
        // a previously-saved tag on update.
        assertThat(normalized("not a language")).isNull();
        assertThat(normalized("en_US")).isNull();
        assertThat(normalized("english!")).isNull();
    }

    @Test
    public void setHtmlLang_keepsNullAbsentButTreatsBlankAsCleared() {
        // null = absent (untouched on update); "" = explicit clear (revert to default).
        assertThat(normalized(null)).isNull();
        assertThat(normalized("")).isEqualTo("");
        assertThat(normalized("   ")).isEqualTo("");
    }

    @Test
    public void setHtmlLang_dropsOverlyLongValues() {
        String tooLong = "en-" + "x".repeat(40);
        assertThat(normalized(tooLong)).isNull();
    }

    // Git import (Gson) and Mongo hydration write the field directly, bypassing the
    // setter. The getter must still normalize, so simulate that with reflection.
    @Test
    public void getHtmlLang_normalizesValuesWrittenDirectlyToField() throws Exception {
        assertThat(rawFieldThenGet("en-US")).isEqualTo("en-us");
        assertThat(rawFieldThenGet("  DE  ")).isEqualTo("de");
        assertThat(rawFieldThenGet("not a language")).isNull();
    }

    private String rawFieldThenGet(String rawValue) throws Exception {
        ApplicationDetail detail = new ApplicationDetail();
        Field field = ApplicationDetailCE.class.getDeclaredField("htmlLang");
        field.setAccessible(true);
        field.set(detail, rawValue);
        return detail.getHtmlLang();
    }
}
