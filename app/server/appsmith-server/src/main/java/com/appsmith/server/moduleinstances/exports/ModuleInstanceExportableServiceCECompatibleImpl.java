package com.appsmith.server.moduleinstances.exports;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCECompatible;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ModuleInstanceExportableServiceCECompatibleImpl implements ExportableServiceCECompatible<ModuleInstance> {

    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson) {

        return Mono.empty().then();
    }
}
