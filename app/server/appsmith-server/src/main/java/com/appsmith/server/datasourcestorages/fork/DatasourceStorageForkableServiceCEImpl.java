package com.appsmith.server.datasourcestorages.fork;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.dtos.ForkingMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.fork.forkable.ForkableServiceCE;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

public class DatasourceStorageForkableServiceCEImpl implements ForkableServiceCE<DatasourceStorage> {
    @Override
    public Flux<DatasourceStorage> getExistingEntitiesInTarget(String targetWorkspaceId) {
        return null;
    }

    @Override
    public <U extends BaseDomain> Flux<DatasourceStorage> getForkableEntitiesFromSource(
            ForkingMetaDTO sourceMeta, Flux<U> dependentEntityFlux) {
        return null;
    }

    @Override
    public Mono<DatasourceStorage> createForkedEntity(
            DatasourceStorage originalEntity,
            ForkingMetaDTO sourceMeta,
            ForkingMetaDTO targetMeta,
            Mono<List<DatasourceStorage>> existingEntities) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public DatasourceStorage initializeFork(DatasourceStorage originalEntity, ForkingMetaDTO targetMeta) {
        AuthenticationDTO initialAuth = null;
        DatasourceStorage newDatasourceStorage = new DatasourceStorage();
        copyNestedNonNullProperties(originalEntity, newDatasourceStorage);
        newDatasourceStorage.setId(null);
        newDatasourceStorage.setDatasourceId(null);

        if (newDatasourceStorage.getDatasourceConfiguration() != null) {
            initialAuth = newDatasourceStorage.getDatasourceConfiguration().getAuthentication();
        }

        if (!Boolean.TRUE.equals(targetMeta.getForkWithConfiguration())) {
            newDatasourceStorage.setDatasourceConfiguration(null);
        }

        /*
        updating the datasource "isConfigured" field, which will be used to return if the forking is a partialImport or not
        post forking any application, datasource reconnection modal will appear based on isConfigured property
        Ref: getApplicationImportDTO()
        */

        boolean isConfigured = targetMeta.getForkWithConfiguration()
                && (newDatasourceStorage.getDatasourceConfiguration() != null
                        && newDatasourceStorage.getDatasourceConfiguration().getAuthentication() != null);

        if (initialAuth instanceof OAuth2) {
            /*
            This is the case for OAuth2 datasources, for example Google sheets, we don't want to copy the token to the
            new workspace as it is user's personal token. Hence, in case of forking to a new workspace the datasource
            needs to be re-authorised.
            */
            newDatasourceStorage.setIsConfigured(false);
            if (isConfigured) {
                newDatasourceStorage
                        .getDatasourceConfiguration()
                        .getAuthentication()
                        .setAuthenticationResponse(null);
            }
        } else {
            newDatasourceStorage.setIsConfigured(isConfigured);
        }

        return newDatasourceStorage;
    }
}
