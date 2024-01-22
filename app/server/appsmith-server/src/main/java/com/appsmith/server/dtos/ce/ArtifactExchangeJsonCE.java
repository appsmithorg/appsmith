package com.appsmith.server.dtos.ce;

import com.appsmith.server.constants.ArtifactJsonType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.ImportableArtifact;
import com.appsmith.server.domains.TransactionalArtifact;

import java.util.List;

public interface ArtifactExchangeJsonCE {

    Integer getClientSchemaVersion();

    void setClientSchemaVersion(Integer clientSchemaVersion);

    Integer getServerSchemaVersion();

    void setServerSchemaVersion(Integer serverSchemaVersion);

    ArtifactJsonType getArtifactJsonType();

    ImportableArtifact getImportableArtifact();

    TransactionalArtifact getTransactionalArtifact();

    List<CustomJSLib> getCustomJsLibFromArtifact();
}
