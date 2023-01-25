package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;

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
    public static final String DEFAULT_THEME_NAME = "default";

    // name will be used internally to identify system themes for import, export application and theme migration
    // it'll never change. We need to remove this from API response in future when FE uses displayName everywhere
    @JsonView(Views.Api.class)
    private String name;

    // displayName will be visible to users. Users can set their own input when saving/customising a theme
    @JsonView(Views.Api.class)
    private String displayName;

    @JsonView(Views.Api.class)
    private String applicationId;

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    @JsonView(Views.Api.class)
    private String organizationId;

    @JsonView(Views.Api.class)
    String workspaceId;

    @JsonView(Views.Api.class)
    private Object config;

    @JsonView(Views.Api.class)
    private Object properties;

    @JsonView(Views.Api.class)
    private Map<String, Object> stylesheet;

    @JsonProperty("isSystemTheme")  // manually setting property name to make sure it's compatible with Gson
    @JsonView(Views.Api.class)
    private boolean isSystemTheme = false;  // should be false by default

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Colors {
        @JsonView(Views.Api.class)
        private String primaryColor;
        @JsonView(Views.Api.class)
        private String backgroundColor;
    }

    public void sanitiseToExportDBObject() {
        this.setId(null);
        if(this.isSystemTheme()) {
            // for system theme, we only need theme name and isSystemTheme properties so set null to others
            this.setProperties(null);
            this.setConfig(null);
            this.setStylesheet(null);
        }
        // set null to base domain properties also
        this.sanitiseToExportBaseObject();
    }
}
