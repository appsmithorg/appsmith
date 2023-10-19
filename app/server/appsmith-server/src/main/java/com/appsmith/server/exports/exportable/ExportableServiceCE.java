package com.appsmith.server.exports.exportable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ExportableServiceCE<T extends BaseDomain> {

    Mono<List<T>> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson);

    default void sanitizeEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            ApplicationJson applicationJson,
            SerialiseApplicationObjective serialiseFor) {}

    default void mapNameToIdForExportableEntities(
            MappedExportableResourcesDTO mappedExportableResourcesDTO, List<T> entityList) {}
}
