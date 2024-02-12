package com.appsmith.server.dtos.ce;

import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ExportableArtifact;
import com.appsmith.server.domains.ImportableArtifact;

import java.util.List;

public interface ArtifactExchangeJsonCE {

    Integer getClientSchemaVersion();

    void setClientSchemaVersion(Integer clientSchemaVersion);

    Integer getServerSchemaVersion();

    void setServerSchemaVersion(Integer serverSchemaVersion);

    ArtifactJsonType getArtifactJsonType();

    ImportableArtifact getImportableArtifact();

    ExportableArtifact getExportableArtifact();

    List<CustomJSLib> getCustomJsLibFromArtifact();
}
