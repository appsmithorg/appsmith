package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.gson.annotations.SerializedName;
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
    public static final String LEGACY_THEME_NAME = "classic";
    public static final String DEFAULT_THEME_NAME = "classic";

    @NotNull
    private String name;
    private Config config;
    private Properties properties;
    private Map<String, WidgetStyle> stylesheet;

    @JsonProperty("isSystemTheme")  // manually setting property name to make sure it's compatible with Gson
    private boolean isSystemTheme = false;  // should be false by default

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Properties {
        private Colors colors;
        private BorderRadiusProperties borderRadius;
        private BoxShadowProperties boxShadow;
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
    public static class Config {
        private Colors colors;
        private BorderRadius borderRadius;
        private BoxShadow boxShadow;
        private FontFamily fontFamily;
    }

    @Data
    public static class ResponsiveAttributes {
        @JsonProperty("none")
        @SerializedName("none")
        private String noneValue;

        @JsonProperty("DEFAULT")
        @SerializedName("DEFAULT")
        private String defaultValue;

        @JsonProperty("md")
        @SerializedName("md")
        private String mdValue;

        @JsonProperty("lg")
        @SerializedName("lg")
        private String lgValue;

        @JsonProperty("xl")
        @SerializedName("xl")
        private String xlValue;

        @JsonProperty("2xl")
        @SerializedName("2xl")
        private String doubleXlValue;

        @JsonProperty("3xl")
        @SerializedName("3xl")
        private String tripleXlValue;

        @JsonProperty("full")
        @SerializedName("full")
        private String fullValue;
    }

    @Data
    public static class BorderRadius {
        private ResponsiveAttributes appBorderRadius;
    }

    @Data
    public static class BoxShadow {
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
        private String buttonColor;
    }

    @Data
    public static class BorderRadiusProperties {
        private String appBorderRadius;
    }

    @Data
    public static class BoxShadowProperties {
        private String appBoxShadow;
    }
}
