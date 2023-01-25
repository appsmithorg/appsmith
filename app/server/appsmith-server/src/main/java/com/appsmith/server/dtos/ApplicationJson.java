package com.appsmith.server.dtos;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.InvisibleActionFields;
import com.appsmith.external.models.Views;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Transient;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * A DTO class to hold complete information about an application, which will then be serialized to a file so as to
 * export that application into a file.
 */
@Getter
@Setter
public class ApplicationJson {

    // To convey the schema version of the client and will be used to check if the imported file is compatible with
    // current DSL schema
    @Transient
    @JsonView(Views.Api.class)
    Integer clientSchemaVersion;

    // To convey the schema version of the server and will be used to check if the imported file is compatible with
    // current DB schema
    @Transient
    @JsonView(Views.Api.class)
    Integer serverSchemaVersion;

    @JsonView(Views.Api.class)
    Application exportedApplication;

    @JsonView(Views.Api.class)
    List<Datasource> datasourceList;

    @JsonView(Views.Api.class)
    List<CustomJSLib> customJSLibList;

    @JsonView(Views.Api.class)
    List<NewPage> pageList;

    @Deprecated
    @JsonView(Views.Api.class)
    List<String> pageOrder;

    @Deprecated
    @JsonView(Views.Api.class)
    List<String> publishedPageOrder;

    @Deprecated
    @JsonView(Views.Api.class)
    String publishedDefaultPageName;

    @Deprecated
    @JsonView(Views.Api.class)
    String unpublishedDefaultPageName;
    
    @JsonView(Views.Api.class)
    List<NewAction> actionList;

    @JsonView(Views.Api.class)
    List<ActionCollection> actionCollectionList;

    /**
     * This field will be used to store map of files to be updated in local file system by comparing the recent
     * changes in database and the last local git commit.
     * This field can be used while saving resources to local file system and only update the resource files which
     * are updated in the database.
     */
    @JsonView(Views.Internal.class)
    Map<String, Set<String>> updatedResources;

    // TODO remove the plain text fields during the export once we have a way to address sample apps DB authentication
    @JsonView(Views.Api.class)
    Map<String, DecryptedSensitiveFields> decryptedFields;

    @Deprecated
    @JsonView(Views.Api.class)
    Map<String, InvisibleActionFields> invisibleActionFields;

    @JsonView(Views.Api.class)
    Theme editModeTheme;

    @JsonView(Views.Api.class)
    Theme publishedTheme;

    /**
     * Mapping mongoEscapedWidgets with layoutId
     */
    @Deprecated
    @JsonView(Views.Api.class)
    Map<String, Set<String>> publishedLayoutmongoEscapedWidgets;

    @Deprecated
    @JsonView(Views.Api.class)
    Map<String, Set<String>> unpublishedLayoutmongoEscapedWidgets;
}
