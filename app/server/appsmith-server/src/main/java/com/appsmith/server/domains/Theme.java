package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.Map;

@Getter
@Setter
@Document
public class Theme extends BaseDomain {
    public static final String LEGACY_THEME_NAME = "classic";
    public static final String DEFAULT_THEME_NAME = "classic";

    @NotNull
    private String name;
    private String applicationId;
    private String organizationId;
    private Object config;
    private Object properties;
    private Map<String, Object> stylesheet;

    @JsonProperty("isSystemTheme")  // manually setting property name to make sure it's compatible with Gson
    private boolean isSystemTheme = false;  // should be false by default

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Colors {
        private String primaryColor;
        private String backgroundColor;
    }
}
