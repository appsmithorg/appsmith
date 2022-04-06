package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Getter
@Setter
@Document
public class Theme extends BaseDomain {
    public static final String LEGACY_THEME_NAME = "classic";
    public static final String DEFAULT_THEME_NAME = "classic";

    // name will be used internally to identify system themes for import, export application and theme migration
    // it'll never change. We need to remove this from API response in future when FE uses displayName everywhere
    private String name;

    // displayName will be visible to users. Users can set their own input when saving/customising a theme
    private String displayName;

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
