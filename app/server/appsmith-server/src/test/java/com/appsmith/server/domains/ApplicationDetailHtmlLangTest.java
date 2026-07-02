package com.appsmith.server.domains;

import org.junit.jupiter.api.Test;

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
        assertThat(normalized("not a language")).isNull();
        assertThat(normalized("en_US")).isNull();
        assertThat(normalized("english!")).isNull();
    }

    @Test
    public void setHtmlLang_dropsBlankAndNull() {
        assertThat(normalized(null)).isNull();
        assertThat(normalized("")).isNull();
        assertThat(normalized("   ")).isNull();
    }

    @Test
    public void setHtmlLang_dropsOverlyLongValues() {
        String tooLong = "en-" + "x".repeat(40);
        assertThat(normalized(tooLong)).isNull();
    }
}
