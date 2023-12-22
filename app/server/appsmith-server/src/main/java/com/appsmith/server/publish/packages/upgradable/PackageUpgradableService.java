package com.appsmith.server.publish.packages.upgradable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.PackagePublishingMetaDTO;
import com.appsmith.server.dtos.SimulatedModuleInstanceDTO;
import reactor.core.publisher.Mono;

public interface PackageUpgradableService<T extends BaseDomain> {

    Mono<Boolean> getUpgradableEntitiesReferences(PackagePublishingMetaDTO publishingMetaDTO);

    Mono<Boolean> updateExistingEntities(
            ModuleInstance existingModuleInstance,
            SimulatedModuleInstanceDTO simulatedModuleInstanceDTO,
            PackagePublishingMetaDTO publishingMetaDTO);
}
