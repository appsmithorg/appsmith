package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.views.Git;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Getter
@Setter
@Document
@FieldNameConstants
public class Theme extends BaseDomain {
    public static final String LEGACY_THEME_NAME = "classic";
    public static final String DEFAULT_THEME_NAME = "default-new";

    // name will be used internally to identify system themes for import, export application and theme migration
    // it'll never change. We need to remove this from API response in future when FE uses displayName everywhere
    @JsonView({Views.Public.class, Git.class})
    private String name;

    // displayName will be visible to users. Users can set their own input when saving/customising a theme
    @JsonView({Views.Public.class, Git.class})
    private String displayName;

    @JsonView(Views.Public.class)
    private String applicationId;

    @JsonView(Views.Public.class)
    String workspaceId;

    @JsonView({Views.Public.class, Git.class})
    private Object config;

    @JsonView({Views.Public.class, Git.class})
    private Object properties;

    @JsonView({Views.Public.class, Git.class})
    private Map<String, Object> stylesheet;

    @JsonProperty("isSystemTheme") // manually setting property name to make sure it's compatible with Gson
    @JsonView({Views.Public.class, Git.class})
    // The primitive is changed to wrapper because of serialization - deserialization issues
    private Boolean isSystemTheme = false; // should be false by default

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Colors {
        private String primaryColor;
        private String backgroundColor;
    }

    public void setSystemTheme(boolean isSystemTheme) {
        this.isSystemTheme = isSystemTheme;
    }

    @JsonView({Views.Internal.class})
    public Boolean getSystemTheme() {
        return this.isSystemTheme;
    }

    // To be deleted in later on refactors
    @JsonView({Views.Internal.class})
    public Boolean isSystemTheme() {
        return this.isSystemTheme;
    }

    @Override
    public void sanitiseToExportDBObject() {
        this.setId(null);
        if (this.isSystemTheme()) {
            // for system theme, we only need theme name and isSystemTheme properties so set null to others
            this.setProperties(null);
            this.setConfig(null);
            this.setStylesheet(null);
        }
        // set null to base domain properties also
        super.sanitiseToExportDBObject();
    }

    public static class Fields extends BaseDomain.Fields {}
}
