package com.appsmith.server.datasources.fork;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ForkingMetaDTO;
import com.appsmith.server.fork.forkable.ForkableService;
import com.appsmith.server.fork.forkable.ForkableServiceCE;
import org.hibernate.exception.ConstraintViolationException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

public class DatasourceForkableServiceCEImpl implements ForkableServiceCE<Datasource> {

    private final DatasourceService datasourceService;
    private final DatasourceStorageService datasourceStorageService;
    private final ForkableService<DatasourceStorage> datasourceStorageForkableService;

    public DatasourceForkableServiceCEImpl(
            DatasourceService datasourceService,
            DatasourceStorageService datasourceStorageService,
            ForkableService<DatasourceStorage> datasourceStorageForkableService) {
        this.datasourceService = datasourceService;
        this.datasourceStorageService = datasourceStorageService;
        this.datasourceStorageForkableService = datasourceStorageForkableService;
    }

    @Override
    public Flux<Datasource> getExistingEntitiesInTarget(String targetWorkspaceId) {
        return datasourceService.getAllByWorkspaceIdWithStorages(targetWorkspaceId, null);
    }

    @Override
    public <U extends BaseDomain> Flux<Datasource> getForkableEntitiesFromSource(
            ForkingMetaDTO sourceMeta, Flux<U> dependentEntityFlux) {

        return dependentEntityFlux
                .ofType(NewAction.class)
                .map(newAction -> newAction.getUnpublishedAction().getDatasource())
                .filter(datasource -> datasource.getId() != null)
                .collect(Collectors.toSet())
                .flatMapMany(Flux::fromIterable)
                .flatMap(datasource -> datasourceService.findByIdWithStorages(datasource.getId()));
    }

    @Override
    public Mono<Datasource> createForkedEntity(
            Datasource datasourceToFork,
            ForkingMetaDTO sourceMeta,
            ForkingMetaDTO targetMeta,
            Mono<List<Datasource>> existingDatasourcesInNewWorkspaceMono) {

        return existingDatasourcesInNewWorkspaceMono.flatMap(existingDatasourcesWithoutStorages -> {
            if (datasourceToFork.getWorkspaceId().equals(targetMeta.getWorkspaceId())) {
                return Mono.just(datasourceToFork);
            }

            DatasourceStorageDTO storageDTOToFork =
                    datasourceToFork.getDatasourceStorages().get(sourceMeta.getEnvironmentId());

            final AuthenticationDTO authentication = storageDTOToFork.getDatasourceConfiguration() == null
                    ? null
                    : storageDTOToFork.getDatasourceConfiguration().getAuthentication();
            if (authentication != null) {
                authentication.setIsAuthorized(null);
            }

            return Flux.fromIterable(existingDatasourcesWithoutStorages)
                    .filter(datasourceToFork::softEquals)
                    .filterWhen(existingDatasource -> {
                        Mono<DatasourceStorage> datasourceStorageMono =
                                datasourceStorageService.findStrictlyByDatasourceIdAndEnvironmentId(
                                        existingDatasource.getId(), targetMeta.getEnvironmentId());

                        return datasourceStorageMono
                                .map(existingStorage -> {
                                    final AuthenticationDTO auth = existingStorage.getDatasourceConfiguration() == null
                                            ? null
                                            : existingStorage
                                                    .getDatasourceConfiguration()
                                                    .getAuthentication();
                                    if (auth != null) {
                                        auth.setIsAuthorized(null);
                                    }
                                    return storageDTOToFork.softEquals(
                                            datasourceStorageService.createDatasourceStorageDTOFromDatasourceStorage(
                                                    existingStorage));
                                })
                                .switchIfEmpty(Mono.just(false));
                    })
                    .next() // Get the first matching datasource, we don't need more than one here.
                    .switchIfEmpty(Mono.defer(() -> {
                        // No matching existing datasource found, so create a new one.
                        Datasource newDs = this.initializeFork(datasourceToFork, targetMeta);
                        DatasourceStorageDTO storageDTO =
                                datasourceToFork.getDatasourceStorages().get(sourceMeta.getEnvironmentId());
                        DatasourceStorage sourceStorage =
                                datasourceStorageService.createDatasourceStorageFromDatasourceStorageDTO(storageDTO);

                        DatasourceStorage targetStorage =
                                datasourceStorageForkableService.initializeFork(sourceStorage, targetMeta);
                        storageDTO =
                                datasourceStorageService.createDatasourceStorageDTOFromDatasourceStorage(targetStorage);

                        storageDTO.setEnvironmentId(targetMeta.getEnvironmentId());
                        newDs.getDatasourceStorages().put(targetMeta.getEnvironmentId(), storageDTO);
                        return createSuffixedDatasource(newDs);
                    }));
        }); // */
    }

    /**
     * This method defines the behaviour of a datasource when the application is forked from one workspace to another.
     * It creates a new object from the source datasource object
     * Removes the id and updated at from the object
     * Based on forkWithConfiguration field present in the source app, it sets the authentication for the datasource
     * Returns the new datasource object
     */
    @Override
    public Datasource initializeFork(Datasource originalEntity, ForkingMetaDTO targetMeta) {
        Datasource newDs = new Datasource();
        copyNestedNonNullProperties(originalEntity, newDs);
        newDs.makePristine();
        newDs.setGitSyncId(null);
        newDs.setWorkspaceId(targetMeta.getWorkspaceId());
        newDs.setDatasourceStorages(new HashMap<>());
        newDs.setIsConfigured(null);
        newDs.setInvalids(null);

        return newDs;
    }

    private Mono<Datasource> createSuffixedDatasource(Datasource datasource) {
        return createSuffixedDatasource(datasource, datasource.getName(), 0);
    }

    /**
     * Tries to create the given datasource with the name, over and over again with an incremented suffix, but **only**
     * if the error is because of a name clash.
     *
     * @param datasource Datasource to try to create.
     * @param name       Name of the datasource, to which numbered suffixes will be appended.
     * @param suffix     Suffix used for appending, recursion artifact. Usually set to 0.
     * @return A Mono that yields the created datasource.
     */
    private Mono<Datasource> createSuffixedDatasource(Datasource datasource, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        datasource.setName(actualName);
        return datasourceService.create(datasource).onErrorResume(ConstraintViolationException.class, error -> {
            if (error.getMessage() != null && error.getMessage().contains("datasource_workspace_name_key")) {
                return createSuffixedDatasource(datasource, name, 1 + suffix);
            }
            throw error;
        });
    }
}
