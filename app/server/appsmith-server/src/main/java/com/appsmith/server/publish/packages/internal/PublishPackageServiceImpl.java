package com.appsmith.server.publish.packages.internal;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PackagePublishingMetaDTO;
import com.appsmith.server.dtos.SimulatedModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PackageUtils;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.publish.packages.publishable.PackagePublishableService;
import com.appsmith.server.publish.packages.upgradable.PackageUpgradableService;
import com.appsmith.server.repositories.PackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class PublishPackageServiceImpl extends PublishPackageCECompatibleServiceImpl implements PublishPackageService {
    private final PackageRepository packageRepository;
    private final PackagePermission packagePermission;
    private final PackagePublishableService<Module> modulePackagePublishableService;
    private final PackagePublishableService<NewAction> newActionPackagePublishableService;
    private final PackagePublishableService<ActionCollection> actionCollectionPackagePublishableService;
    private final CrudModuleInstanceService crudModuleInstanceService;
    private final UpdateLayoutService updateLayoutService;
    private final TransactionalOperator transactionalOperator;

    private final PackageUpgradableService<ModuleInstance> moduleInstancePackageUpgradableService;
    private final PackageUpgradableService<NewAction> newActionPackageUpgradableService;
    private final PackageUpgradableService<ActionCollection> actionCollectionPackageUpgradableService;

    /**
     * Publishes a package identified by its unique identifier.
     *
     * @param packageId The unique identifier of the package to be published.
     * @return A Mono emitting a boolean value indicating the success of the package publishing operation.
     * Returns `true` if the package is successfully published, otherwise `false`.
     * @throws AppsmithException if the package with the specified ID is not found or if there are ACL-related issues.
     *
     *                           <p>This method retrieves the specified package by its ID, verifies the necessary permissions,
     *                           and then proceeds to publish the package. It calculates the next version of the package,
     *                           constructs the package to be published, and updates the version and last published timestamp
     *                           of the original package. The publishing operation involves saving both the updated original package
     *                           and the new package to be published in the database.
     *
     *                           <p>After the packages are saved, the method initiates the publishing process for modules, actions,
     *                           and other publishable entities associated with the package. It handles auto-upgrade of module instances,
     *                           retains public action settings, and ensures the successful publication of the entire package.
     *                           If any of these steps fail, the method returns `false`.
     *
     *                           <p>This method is transactional, ensuring the atomicity of the entire publishing process.
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<Boolean> publishPackage(String packageId) {
        PackagePublishingMetaDTO publishingMetaDTO = new PackagePublishingMetaDTO();

        return packageRepository
                .findById(packageId, packagePermission.getPublishPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, packageId)))
                .flatMap(originalPackage -> {
                    int[] currentRawVersion = PackageUtils.parseVersion(originalPackage.getVersion());
                    String nextVersion = PackageUtils.getNextVersion(
                            currentRawVersion[0], currentRawVersion[1], currentRawVersion[2]);

                    // construct the package that's going to be published
                    Package packageToBePublished = constructPackageToBePublished(originalPackage, nextVersion);

                    // set the next version to the original package, so that the original package can always tell what's
                    // the latest version and when did it get published
                    originalPackage.setVersion(nextVersion);
                    originalPackage.setLastPublishedAt(packageToBePublished.getLastPublishedAt());
                    publishingMetaDTO.setSourcePackageId(packageId);

                    Mono<Package> saveOriginalPackage = packageRepository.save(originalPackage);
                    Mono<Package> savePackageToBePublished = packageRepository.save(packageToBePublished);

                    return Mono.zip(saveOriginalPackage, savePackageToBePublished)
                            .flatMap(tuple2 -> {
                                Package publishedPackage = tuple2.getT2();
                                publishingMetaDTO.setPublishedPackage(publishedPackage);

                                return modulePackagePublishableService
                                        .publishEntities(publishingMetaDTO)
                                        .flatMap(publishedModules -> {
                                            if (publishedModules.isEmpty()) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.PACKAGE_CANNOT_BE_PUBLISHED,
                                                        originalPackage
                                                                .getUnpublishedPackage()
                                                                .getName()));
                                            }
                                            // TODO: Add publish step for module instances inside the module as well
                                            return newActionPackagePublishableService
                                                    .publishEntities(publishingMetaDTO)
                                                    .then(Mono.defer(() ->
                                                            actionCollectionPackagePublishableService.publishEntities(
                                                                    publishingMetaDTO)));
                                        });
                            })
                            .then(Mono.defer(() -> handleAutoUpgrade(publishingMetaDTO)));
                })
                .as(transactionalOperator::transactional)
                .then(Mono.defer(() -> {
                    Mono<List<String>> updateLayoutsMono = Flux.fromIterable(publishingMetaDTO.getAutoUpgradedPageIds())
                            .flatMap(pageId -> updateLayoutService.updatePageLayoutsByPageId(pageId))
                            .collectList();

                    return updateLayoutsMono.thenReturn(Boolean.TRUE);
                }));
    }

    private Mono<Void> handleAutoUpgrade(PackagePublishingMetaDTO publishingMetaDTO) {
        // First gather all the existing module instances and their resources
        // Note: We will have to parse through every single entity here because thee is a possibility that
        // the edit mode of the module we are trying to publish had gone through an auto upgrade
        // of a composite module instance itself, can't skip any entity
        Mono<Boolean> existingModuleInstancesMono =
                moduleInstancePackageUpgradableService.getUpgradableEntitiesReferences(publishingMetaDTO);
        Mono<Boolean> existingNewActionsMono =
                newActionPackageUpgradableService.getUpgradableEntitiesReferences(publishingMetaDTO);
        Mono<Boolean> existingActionCollectionsMono =
                actionCollectionPackageUpgradableService.getUpgradableEntitiesReferences(publishingMetaDTO);
        // TODO: Add on for existing JS libs here

        Mono<Boolean> getEntitiesFromExistingInstancesMono = existingModuleInstancesMono
                .then(Mono.defer(() -> Mono.zip(existingNewActionsMono, existingActionCollectionsMono)))
                .thenReturn(true);

        Map<String, Module> sourceModuleIdToPublishedModuleMap =
                publishingMetaDTO.getOriginModuleIdToPublishedModuleMap();
        // For each module instance, simulate instantiation again using the new published module
        Mono<Void> updatedModuleInstancesMono = Flux.fromIterable(publishingMetaDTO
                        .getExistingModuleInstanceIdToModuleInstanceMap()
                        .values())
                .flatMap(existingModuleInstance -> {
                    Module publishedModule =
                            sourceModuleIdToPublishedModuleMap.get(existingModuleInstance.getOriginModuleId());

                    ModuleInstanceDTO moduleInstanceRequest =
                            prepareCreateModuleInstanceRequest(publishedModule, existingModuleInstance);
                    String branchName =
                            existingModuleInstance.getDefaultResources().getBranchName();
                    Mono<Module> moduleMono = Mono.just(publishedModule).cache();
                    Mono<SimulatedModuleInstanceDTO> simulatedInstanceMono =
                            crudModuleInstanceService.simulateCreateModuleInstance(
                                    moduleInstanceRequest, branchName, moduleMono);

                    if (existingModuleInstance.getUnpublishedModuleInstance().getPageId() != null) {
                        publishingMetaDTO
                                .getAutoUpgradedPageIds()
                                .add(existingModuleInstance
                                        .getUnpublishedModuleInstance()
                                        .getPageId());
                    }

                    // Update existing module instances (both root and composite)
                    return simulatedInstanceMono.flatMap(simulatedModuleInstanceDTO -> {
                        return moduleInstancePackageUpgradableService
                                .updateExistingEntities(
                                        existingModuleInstance, simulatedModuleInstanceDTO, publishingMetaDTO)
                                .then(newActionPackageUpgradableService.updateExistingEntities(
                                        existingModuleInstance, simulatedModuleInstanceDTO, publishingMetaDTO))
                                .then(actionCollectionPackageUpgradableService.updateExistingEntities(
                                        existingModuleInstance, simulatedModuleInstanceDTO, publishingMetaDTO));
                    });
                })
                .collectList()
                .then();

        return getEntitiesFromExistingInstancesMono
                .then(Mono.defer(() -> updatedModuleInstancesMono))
                .then();
    }

    private ModuleInstanceDTO prepareCreateModuleInstanceRequest(
            Module newSourceModule, ModuleInstance oldModuleInstance) {
        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setName(
                oldModuleInstance.getUnpublishedModuleInstance().getName());
        setContextTypeAndContextId(oldModuleInstance.getUnpublishedModuleInstance(), moduleInstanceReqDTO);
        moduleInstanceReqDTO.setSourceModuleId(newSourceModule.getId());
        return moduleInstanceReqDTO;
    }

    private void setContextTypeAndContextId(
            ModuleInstanceDTO oldModuleInstanceDTO, ModuleInstanceDTO moduleInstanceReqDTO) {
        moduleInstanceReqDTO.setContextType(oldModuleInstanceDTO.getContextType());
        if (oldModuleInstanceDTO.getContextType().equals(CreatorContextType.PAGE)) {
            moduleInstanceReqDTO.setContextId(oldModuleInstanceDTO.getPageId());
        } else if (oldModuleInstanceDTO.getContextType().equals(CreatorContextType.MODULE)) {
            moduleInstanceReqDTO.setContextId(oldModuleInstanceDTO.getModuleId());
        }
    }

    private Package constructPackageToBePublished(Package sourcePkg, String nextVersion) {
        Package pkgToBePublished = new Package();
        AppsmithBeanUtils.copyNestedNonNullProperties(sourcePkg, pkgToBePublished);
        pkgToBePublished.setPublishedPackage(sourcePkg.getUnpublishedPackage());
        pkgToBePublished.setUnpublishedPackage(new PackageDTO());
        pkgToBePublished.setSourcePackageId(sourcePkg.getId());
        pkgToBePublished.setVersion(nextVersion);
        pkgToBePublished.setLastPublishedAt(Instant.now());
        pkgToBePublished.setId(null);

        // The published version of the package should only be readable and exportable
        Set<Policy> updatedPolicies = pkgToBePublished.getPolicies().stream()
                .filter(policy -> policy.getPermission()
                                .equals(packagePermission.getReadPermission().getValue())
                        || policy.getPermission()
                                .equals(packagePermission.getExportPermission().getValue()))
                .collect(Collectors.toSet());

        pkgToBePublished.setPolicies(updatedPolicies);

        return pkgToBePublished;
    }
}
