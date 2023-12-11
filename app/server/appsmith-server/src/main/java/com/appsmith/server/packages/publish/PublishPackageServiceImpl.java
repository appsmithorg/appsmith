package com.appsmith.server.packages.publish;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInstanceDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PublishingMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PackageUtils;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.packages.permissions.PackagePermission;
import com.appsmith.server.publish.publishable.PackagePublishableService;
import com.appsmith.server.repositories.PackageRepository;
import com.appsmith.server.services.LayoutActionService;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PublishPackageServiceImpl extends PublishPackageCECompatibleServiceImpl implements PublishPackageService {
    private final PackageRepository packageRepository;
    private final PackagePermission packagePermission;
    private final PackagePublishableService<Module> modulePublishableService;
    private final PackagePublishableService<NewAction> newActionPublishableService;
    private final PackagePublishableService<ActionCollection> actionCollectionPackagePublishableService;
    private final CrudModuleInstanceService crudModuleInstanceService;
    private final LayoutModuleInstanceService layoutModuleInstanceService;
    private final NewActionService newActionService;
    private final LayoutActionService layoutActionService;
    ;
    private final TransactionalOperator transactionalOperator;

    public PublishPackageServiceImpl(
            PackageRepository packageRepository,
            PackagePermission packagePermission,
            PackagePublishableService<Module> modulePublishableService,
            PackagePublishableService<NewAction> newActionPublishableService,
            PackagePublishableService<ActionCollection> actionCollectionPackagePublishableService,
            CrudModuleInstanceService crudModuleInstanceService,
            LayoutModuleInstanceService layoutModuleInstanceService,
            NewActionService newActionService,
            LayoutActionService layoutActionService,
            TransactionalOperator transactionalOperator) {
        this.packageRepository = packageRepository;
        this.packagePermission = packagePermission;
        this.modulePublishableService = modulePublishableService;
        this.newActionPublishableService = newActionPublishableService;
        this.actionCollectionPackagePublishableService = actionCollectionPackagePublishableService;
        this.crudModuleInstanceService = crudModuleInstanceService;
        this.layoutModuleInstanceService = layoutModuleInstanceService;
        this.layoutActionService = layoutActionService;
        this.transactionalOperator = transactionalOperator;
        this.newActionService = newActionService;
    }

    /**
     * Publishes a package identified by its unique identifier.
     *
     * @param packageId The unique identifier of the package to be published.
     * @return A Mono emitting a boolean value indicating the success of the package publishing operation.
     *         Returns `true` if the package is successfully published, otherwise `false`.
     * @throws AppsmithException if the package with the specified ID is not found or if there are ACL-related issues.
     *
     * <p>This method retrieves the specified package by its ID, verifies the necessary permissions,
     * and then proceeds to publish the package. It calculates the next version of the package,
     * constructs the package to be published, and updates the version and last published timestamp
     * of the original package. The publishing operation involves saving both the updated original package
     * and the new package to be published in the database.
     *
     * <p>After the packages are saved, the method initiates the publishing process for modules, actions,
     * and other publishable entities associated with the package. It handles auto-upgrade of module instances,
     * retains public action settings, and ensures the successful publication of the entire package.
     * If any of these steps fail, the method returns `false`.
     *
     * <p>This method is transactional, ensuring the atomicity of the entire publishing process.
     */
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<Boolean> publishPackage(String packageId) {
        return packageRepository
                .findById(packageId, packagePermission.getPublishPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PACKAGE_ID, packageId)))
                .flatMap(originalPackage -> {
                    int[] currentRawVersion = PackageUtils.parseVersion(originalPackage.getVersion());
                    String nextVersion = PackageUtils.getNextVersion(
                            currentRawVersion[0], currentRawVersion[1], currentRawVersion[2]);

                    // construct the package that's going to be published
                    Package pkgToBePublished = constructPackageToBePublished(originalPackage, nextVersion);

                    // set the next version to the original package, so that the original package can always tell what's
                    // the latest version and when did it get published
                    originalPackage.setVersion(nextVersion);
                    originalPackage.setLastPublishedAt(pkgToBePublished.getLastPublishedAt());

                    PublishingMetaDTO publishingMetaDTO = new PublishingMetaDTO();
                    publishingMetaDTO.setSourcePackageId(packageId);

                    Mono<Package> saveOriginalPackage = packageRepository.save(originalPackage);
                    Mono<Package> savePackageToBePublished = packageRepository.save(pkgToBePublished);

                    return Mono.zip(saveOriginalPackage, savePackageToBePublished)
                            .flatMap(tuple2 -> {
                                Package publishedPkg = tuple2.getT2();
                                publishingMetaDTO.setPublishedPackage(publishedPkg);

                                return modulePublishableService
                                        .getPublishableEntities(publishingMetaDTO)
                                        .flatMap(publishedModules -> {
                                            if (publishedModules.isEmpty()) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.PACKAGE_CANNOT_BE_PUBLISHED,
                                                        originalPackage
                                                                .getUnpublishedPackage()
                                                                .getName()));
                                            }
                                            return newActionPublishableService
                                                    .getPublishableEntities(publishingMetaDTO)
                                                    .then(
                                                            actionCollectionPackagePublishableService
                                                                    .getPublishableEntities(publishingMetaDTO))
                                                    .thenReturn(Boolean.TRUE);
                                        });
                            })
                            .flatMap(published ->
                                    handleAutoUpgrade(publishingMetaDTO).collectList())
                            .then(Mono.defer(() -> retainPublicActionSettings(publishingMetaDTO)))
                            .thenReturn(Boolean.TRUE);
                })
                .as(transactionalOperator::transactional);
    }

    private Mono<Void> retainPublicActionSettings(PublishingMetaDTO publishingMetaDTO) {
        Flux<Tuple2<ActionDTO, NewAction>> updateActionsFlux = Flux.fromIterable(
                        publishingMetaDTO.getOldPublicActionMap().entrySet())
                .flatMap(entry -> {
                    ActionDTO oldActionDTO = entry.getValue();
                    ActionDTO newActionDTO =
                            publishingMetaDTO.getNewPublicActionMap().get(entry.getKey());

                    // Retain specific properties from the old public action
                    newActionDTO.setExecuteOnLoad(oldActionDTO.getExecuteOnLoad());
                    newActionDTO.setUserSetOnLoad(oldActionDTO.getUserSetOnLoad());
                    newActionDTO.setConfirmBeforeExecute(oldActionDTO.getConfirmBeforeExecute());

                    Mono<ActionDTO> userSetExecuteOnLoadMono = Mono.from(Mono.just(oldActionDTO.getUserSetOnLoad()))
                            .flatMap(userSet -> {
                                if (userSet) {
                                    return layoutActionService.setExecuteOnLoad(
                                            newActionDTO.getId(), oldActionDTO.getUserSetOnLoad());
                                }
                                return Mono.just(newActionDTO);
                            });

                    // Return a Mono for each update operation
                    return newActionService
                            .updateUnpublishedActionWithoutAnalytics(
                                    newActionDTO.getId(), newActionDTO, Optional.of(AclPermission.MANAGE_ACTIONS))
                            .flatMap(tuple2 -> userSetExecuteOnLoadMono.thenReturn(tuple2));
                });

        return updateActionsFlux.then();
    }

    private Flux<ModuleInstanceDTO> handleAutoUpgrade(PublishingMetaDTO publishingMetaDTO) {
        return Flux.fromIterable(publishingMetaDTO.getPublishedModules())
                .flatMap(newSourceModule -> crudModuleInstanceService
                        .findAllUnpublishedByModuleUUID(newSourceModule.getModuleUUID(), Optional.empty())
                        .flatMap(oldModuleInstance -> {
                            Flux<NewAction> oldPublicActionFlux = newActionService.findPublicActionsByModuleInstanceId(
                                    oldModuleInstance.getId(), Optional.empty());

                            return prepareMapForOldPublicActions(
                                            publishingMetaDTO, oldModuleInstance, oldPublicActionFlux)
                                    .then(crudModuleInstanceService
                                            .deleteUnpublishedModuleInstance(oldModuleInstance.getId(), null)
                                            .flatMap(deletedModuleInstance -> {
                                                ModuleInstanceDTO moduleInstanceReqDTO =
                                                        prepareCreateModuleInstanceRequest(
                                                                newSourceModule, oldModuleInstance);

                                                return createAndUpdateModuleInstance(
                                                        publishingMetaDTO, oldModuleInstance, moduleInstanceReqDTO);
                                            }));
                        }));
    }

    private Mono<ModuleInstanceDTO> createAndUpdateModuleInstance(
            PublishingMetaDTO publishingMetaDTO,
            ModuleInstance oldModuleInstance,
            ModuleInstanceDTO moduleInstanceReqDTO) {
        return crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, null)
                .flatMap(createModuleInstanceResponseDTO -> {
                    ModuleInstanceDTO newModuleInstance = createModuleInstanceResponseDTO.getModuleInstance();

                    Flux<NewAction> newPublicActionFlux = newActionService.findPublicActionsByModuleInstanceId(
                            newModuleInstance.getId(), Optional.empty());

                    Mono<ModuleInstanceDTO> mergeOldAndNewInputsAndUpdateModuleInstanceMono =
                            mergeOldAndNewInputsAndUpdateModuleInstance(
                                    publishingMetaDTO, oldModuleInstance, newModuleInstance, newPublicActionFlux);

                    return mergeOldAndNewInputsAndUpdateModuleInstanceMono;
                });
    }

    private ModuleInstanceDTO prepareCreateModuleInstanceRequest(
            Module newSourceModule, ModuleInstance oldModuleInstance) {
        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setName(
                oldModuleInstance.getUnpublishedModuleInstance().getName());
        setContextTypeAndContextId(oldModuleInstance, moduleInstanceReqDTO);
        moduleInstanceReqDTO.setSourceModuleId(newSourceModule.getId());
        return moduleInstanceReqDTO;
    }

    private Mono<ModuleInstanceDTO> mergeOldAndNewInputsAndUpdateModuleInstance(
            PublishingMetaDTO publishingMetaDTO,
            ModuleInstance oldModuleInstance,
            ModuleInstanceDTO newModuleInstance,
            Flux<NewAction> newPublicActionFlux) {
        return prepareMapForNewPublicActions(publishingMetaDTO, oldModuleInstance, newPublicActionFlux)
                .then(Mono.defer(() -> {
                    Map<String, String> updatedInputs = mergeInputs(
                            newModuleInstance.getInputs(),
                            oldModuleInstance.getUnpublishedModuleInstance().getInputs());
                    newModuleInstance.setInputs(updatedInputs);

                    return layoutModuleInstanceService.updateUnpublishedModuleInstance(
                            newModuleInstance, newModuleInstance.getId(), null, false);
                }));
    }

    private void setContextTypeAndContextId(ModuleInstance oldModuleInstance, ModuleInstanceDTO moduleInstanceReqDTO) {
        moduleInstanceReqDTO.setContextType(oldModuleInstance.getContextType());
        if (oldModuleInstance.getContextType().equals(CreatorContextType.PAGE)) {
            moduleInstanceReqDTO.setContextId(oldModuleInstance.getPageId());
        } else if (oldModuleInstance.getContextType().equals(CreatorContextType.MODULE)) {
            moduleInstanceReqDTO.setContextId(oldModuleInstance.getModuleId());
        }
    }

    private Mono<List<ActionDTO>> prepareMapForNewPublicActions(
            PublishingMetaDTO publishingMetaDTO,
            ModuleInstance oldModuleInstance,
            Flux<NewAction> newPublicActionFlux) {
        return newPublicActionFlux
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(newPublicAction -> {
                    String newKey = generateActionIdentifier(oldModuleInstance, newPublicAction);
                    publishingMetaDTO.getNewPublicActionMap().put(newKey, newPublicAction);

                    return newPublicAction;
                })
                .collectList();
    }

    @NotNull private static String generateActionIdentifier(ModuleInstance oldModuleInstance, ActionDTO publicAction) {
        return oldModuleInstance.getUnpublishedModuleInstance().getName() + "_" + publicAction.getName();
    }

    private Mono<List<ActionDTO>> prepareMapForOldPublicActions(
            PublishingMetaDTO publishingMetaDTO, ModuleInstance oldModuleInstance, Flux<NewAction> publicActionFlux) {
        return publicActionFlux
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(oldPublicAction -> {
                    String oldKey = generateActionIdentifier(oldModuleInstance, oldPublicAction);
                    publishingMetaDTO.getOldPublicActionMap().put(oldKey, oldPublicAction);

                    return oldPublicAction;
                })
                .collectList();
    }

    private Map<String, String> mergeInputs(Map<String, String> newInputs, Map<String, String> oldInputs) {
        if (oldInputs == null || oldInputs.isEmpty()) {
            return newInputs;
        }
        if (newInputs == null || newInputs.isEmpty()) {
            return Collections.emptyMap();
        }
        return newInputs.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> oldInputs.containsKey(entry.getKey())
                                ? oldInputs.get(entry.getKey())
                                : entry.getValue()));
    }

    private Package constructPackageToBePublished(Package sourcePkg, String nextVersion) {
        Package pkgToBePublished = new Package();
        AppsmithBeanUtils.copyNestedNonNullProperties(sourcePkg, pkgToBePublished);
        pkgToBePublished.setPublishedPackage(sourcePkg.getUnpublishedPackage());
        pkgToBePublished.setUnpublishedPackage(new PackageDTO());
        pkgToBePublished.setSrcPackageId(sourcePkg.getId());
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
