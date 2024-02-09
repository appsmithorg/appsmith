package com.appsmith.server.dtos;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * A DTO class to hold complete information about a package,
 * which will then be serialized to a file,
 * to export that package into a file.
 */
@Getter
@Setter
public class PackageJson implements ArtifactExchangeJson {

    // To convey the schema version of the client and will be used to check if the imported file is compatible with
    // current DSL schema
    @JsonView({Views.Public.class, Views.Export.class})
    Integer clientSchemaVersion;

    // To convey the schema version of the server and will be used to check if the imported file is compatible with
    // current DB schema
    @JsonView({Views.Public.class, Views.Export.class})
    Integer serverSchemaVersion;

    @JsonView({Views.Public.class, Views.Export.class})
    Package exportedPackage;

    @JsonView(Views.Public.class)
    List<DatasourceStorage> datasourceList;

    @JsonView({Views.Public.class, Views.Export.class})
    List<Module> moduleList;

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

    @JsonView({Views.Public.class, Views.Export.class})
    String widgets;

    @Override
    public ArtifactJsonType getArtifactJsonType() {
        return ArtifactJsonType.PACKAGE;
    }

    @Override
    public ImportableArtifact getImportableArtifact() {
        return this.getExportedPackage();
    }

    @Override
    public ExportableArtifact getExportableArtifact() {
        return this.getExportedPackage();
    }
}
