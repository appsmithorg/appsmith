package com.appsmith.server.domains.ce;

import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.Application;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.regex.Pattern;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class ApplicationDetailCE {
    // Loose BCP 47 shape check; realistic tags stay well under this length.
    // Keep in sync with BCP47_REGEX in the client GeneralSettings.tsx.
    private static final Pattern HTML_LANG_PATTERN = Pattern.compile("^[a-z]{2,3}(-[a-z0-9]+)*$");
    private static final int HTML_LANG_MAX_LENGTH = 35;

    @JsonView({Views.Public.class, Git.class})
    Application.AppPositioning appPositioning;

    @JsonView({Views.Public.class, Git.class})
    Application.NavigationSetting navigationSetting;

    @JsonView({Views.Public.class, Git.class})
    Application.ThemeSetting themeSetting;

    @JsonView({Views.Public.class, Git.class})
    String htmlLang;

    public ApplicationDetailCE() {
        this.appPositioning = null;
        this.navigationSetting = null;
        this.themeSetting = new Application.ThemeSetting();
    }

    // Trim, lowercase, length-cap, and drop values that aren't plausible BCP 47 tags
    // (returns null). Applied on both write and read so that values reaching the field
    // through setter-bypassing paths — Git import (Gson field reflection) and Mongo
    // hydration (field access) — are still normalized before they are served into
    // <html lang>. The setter keeps the stored value clean on the REST/Jackson path;
    // the getter guarantees callers never see an un-normalized value regardless of path.
    private static String normalizeHtmlLang(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim().toLowerCase();

        if (normalized.isEmpty()
                || normalized.length() > HTML_LANG_MAX_LENGTH
                || !HTML_LANG_PATTERN.matcher(normalized).matches()) {
            return null;
        }

        return normalized;
    }

    public void setHtmlLang(String htmlLang) {
        this.htmlLang = normalizeHtmlLang(htmlLang);
    }

    public String getHtmlLang() {
        return normalizeHtmlLang(this.htmlLang);
    }
}
