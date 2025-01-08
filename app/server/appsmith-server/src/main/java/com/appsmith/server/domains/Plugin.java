package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Where(clause = "deleted_at IS NULL")
@FieldNameConstants
@Cache(usage = CacheConcurrencyStrategy.TRANSACTIONAL)
public class Plugin extends BaseDomain {

    public enum ResponseType {
        TABLE,
        JSON,
    }

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    @Enumerated(EnumType.STRING)
    PluginType type;

    @JsonView(Views.Public.class)
    String packageName;

    @JsonView(Views.Public.class)
    String pluginName;

    @JsonView(Views.Public.class)
    String jarLocation;

    @JsonView(Views.Public.class)
    String iconLocation;

    @JsonView(Views.Public.class)
    String documentationLink;

    @JsonView(Views.Public.class)
    @Enumerated(EnumType.STRING)
    ResponseType responseType;

    @JsonView(Views.Public.class)
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    List<PluginParameterType> datasourceParams;

    @JsonView(Views.Public.class)
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    List<PluginParameterType> actionParams;

    @JsonView(Views.Public.class)
    String minAppsmithVersionSupported;

    @JsonView(Views.Public.class)
    String maxAppsmithVersionSupported;

    @JsonView(Views.Public.class)
    String version;

    @JsonView(Views.Public.class)
    String uiComponent;

    // Static metadata to indicate what type of form to use in the datasource creation page
    @JsonView(Views.Public.class)
    String datasourceComponent;

    // Static metadata to indicate what type of form to use in the action creation page
    @JsonView(Views.Public.class)
    String actionComponent;

    // Static metadata to indicate if the plugin is suitable for generating CRUD page from DB table if yes then page
    // name will be specified by this field which will be referenced from template application
    // CRUD-DB-Table-Template-Application.json
    @JsonView(Views.Public.class)
    String generateCRUDPageComponent;

    // Marking it as JsonIgnore because we don't want other users to be able to set this property. Only admins
    // must be able to mark a plugin for defaultInstall on all workspace creations
    @JsonView(Views.Internal.class)
    Boolean defaultInstall;

    @JsonView(Views.Public.class)
    Boolean allowUserDatasources = true;

    @JsonView(Views.Public.class)
    boolean isRemotePlugin = false;

    // Stores the equivalent of editor.json for remote plugins
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    @JsonView(Views.Public.class)
    Map<?, ?> actionUiConfig;

    // Stores the equivalent of form.json for remote plugins
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    @JsonView(Views.Public.class)
    Map<?, ?> datasourceUiConfig;

    @Transient
    @JsonView(Views.Public.class)
    Map<String, String> templates;

    // Field to distinguish if the plugin is supported in air-gap instance, by default all the plugins will be
    // supported.
    // One can opt out by adding this field in DB object. Generally SaaS plugins and DB which can't be self-hosted can
    // be a candidate for opting out of air-gap
    @JsonView(Views.Internal.class)
    boolean isSupportedForAirGap = true;

    // Config to set if the plugin has any dependency on cloud-services
    @JsonView(Views.Internal.class)
    Boolean isDependentOnCS;

    public static class Fields extends BaseDomain.Fields {}
}
