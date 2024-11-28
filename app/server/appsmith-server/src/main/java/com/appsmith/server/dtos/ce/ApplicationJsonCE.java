package com.appsmith.server.dtos.ce;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.models.InvisibleActionFields;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * A DTO class to hold complete information about an application,
 * which will then be serialized to a file,
 * to export that application into a file.
 */
@Getter
@Setter
public class ApplicationJsonCE implements ArtifactExchangeJsonCE {

    @JsonView({Views.Public.class, Views.Export.class})
    ArtifactType artifactJsonType = ArtifactType.APPLICATION;

    // To convey the schema version of the client and will be used to check if the imported file is compatible with
    // current DSL schema
    @JsonView({Views.Public.class, Views.Export.class})
    Integer clientSchemaVersion;

    // To convey the schema version of the server and will be used to check if the imported file is compatible with
    // current DB schema
    @JsonView({Views.Public.class, Views.Export.class})
    Integer serverSchemaVersion;

    @JsonView({Views.Public.class, Views.Export.class})
    Application exportedApplication;

    @JsonView(Views.Public.class)
    List<DatasourceStorage> datasourceList;

    @JsonView(Views.Public.class)
    List<DatasourceStorageStructure> datasourceConfigurationStructureList;

    @JsonView({Views.Public.class, Views.Export.class})
    List<CustomJSLib> customJSLibList;

    @JsonView({Views.Public.class, Views.Export.class})
    List<NewPage> pageList;

    @Deprecated
    @JsonView(Views.Public.class)
    List<String> pageOrder;

    @Deprecated
    @JsonView(Views.Public.class)
    List<String> publishedPageOrder;

    @Deprecated
    @JsonView(Views.Public.class)
    String publishedDefaultPageName;

    @Deprecated
    @JsonView(Views.Public.class)
    String unpublishedDefaultPageName;

    @JsonView(Views.Public.class)
    List<NewAction> actionList;

    @JsonView(Views.Public.class)
    List<ActionCollection> actionCollectionList;

    /**
     * This field will be used to store map of files to be updated in local file system by comparing the recent
     * changes in database and the last local git commit.
     * This field can be used while saving resources to local file system and only update the resource files which
     * are updated in the database.
     */
    @JsonView(Views.Internal.class)
    ModifiedResources modifiedResources;

    // TODO remove the plain text fields during the export once we have a way to address sample apps DB authentication
    @JsonView(Views.Public.class)
    Map<String, DecryptedSensitiveFields> decryptedFields;

    @Deprecated
    @JsonView(Views.Public.class)
    Map<String, InvisibleActionFields> invisibleActionFields;

    @JsonView({Views.Public.class, Views.Export.class})
    Theme editModeTheme;

    @JsonView({Views.Public.class, Views.Export.class})
    Theme publishedTheme;

    /**
     * Mapping mongoEscapedWidgets with layoutId
     */
    @Deprecated
    @JsonView(Views.Public.class)
    Map<String, Set<String>> publishedLayoutmongoEscapedWidgets;

    @Deprecated
    @JsonView(Views.Public.class)
    Map<String, Set<String>> unpublishedLayoutmongoEscapedWidgets;

    @JsonView({Views.Public.class, Views.Export.class})
    String widgets;

    @Override
    public Artifact getArtifact() {
        return this.getExportedApplication();
    }

    @Override
    public void setThemes(Theme unpublishedTheme, Theme publishedTheme) {
        this.setEditModeTheme(unpublishedTheme);
        this.setPublishedTheme(publishedTheme);
    }

    @Override
    public Theme getUnpublishedTheme() {
        return this.getEditModeTheme();
    }

    @Override
    public List getContextList() {
        return this.pageList;
    }
}
