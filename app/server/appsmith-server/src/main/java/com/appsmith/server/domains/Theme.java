package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Document
public class Theme extends BaseDomain {
    @NotNull
    private String name;

    private String slug;
    private ThemeConfig config;
    private Properties properties;
    private Map<String, WidgetStyle> stylesheet;

    @JsonIgnore
    private String applicationId;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Properties {
        private Colors colors;
        private BorderRadiusProperties borderRadius;
        private BoxShadowProperties boxShadow;
        private String boxShadowColor;
        private FontFamilyProperties fontFamily;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Colors {
        private String primaryColor;
        private String backgroundColor;
    }

    @Data
    public static class ThemeConfig {
        private Colors colors;
        private ThemeBorderRadius borderRadius;
        private ResponsiveAttributes boxShadow;
        private FontFamily fontFamily;
    }

    @Data
    public static class ResponsiveAttributes {
        @JsonProperty("none")
        private String noneValue;

        @JsonProperty("DEFAULT")
        private String defaultValue;

        @JsonProperty("md")
        private String mdValue;

        @JsonProperty("lg")
        private String lgValue;

        @JsonProperty("xl")
        private String xlValue;

        @JsonProperty("2xl")
        private String doubleXlValue;

        @JsonProperty("3xl")
        private String tripleXlValue;

        @JsonProperty("full")
        private String fullValue;
    }

    @Data
    public static class ThemeBorderRadius {
        private ResponsiveAttributes appBorderRadius;
        private ResponsiveAttributes buttonBorderRadius;
    }

    @Data
    public static class ThemeBoxShadow {
        private ResponsiveAttributes appBoxShadow;
    }

    @Data
    public static class FontFamily {
        private List<String> appFont;
    }

    @Data
    public static class FontFamilyProperties {
        private String appFont;
    }

    @Data
    public static class WidgetStyle {
        private String backgroundColor;
        private String borderRadius;
        private String boxShadow;
        private String primaryColor;
        private String menuColor;
    }

    @Data
    public static class BorderRadiusProperties {
        private String appBorderRadius;
        private String buttonBorderRadius;
    }

    @Data
    public static class BoxShadowProperties {
        private String appBoxShadow;
    }
}
