package com.appsmith.server.exports.exportable.artifactbased;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.artifactbased.utils.ArtifactBasedExportableUtilsCE;
import reactor.core.publisher.Flux;

import java.util.List;

public interface ArtifactBasedExportableServiceCE<T extends BaseDomain, U extends Artifact>
        extends ArtifactBasedExportableUtilsCE<U> {

    Flux<T> findByContextIdsForExport(List<String> contextIds, AclPermission permission);

    void mapExportableReferences(
            MappedExportableResourcesDTO mappedExportableResourcesDTO, T domainObject, ResourceModes resourceMode);

    String getContextNameAtIdReference(Object dtoObject);
}
