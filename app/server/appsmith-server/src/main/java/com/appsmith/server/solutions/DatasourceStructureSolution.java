package com.appsmith.server.solutions;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.CustomDatasourceRepository;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.services.PluginService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatasourceStructureSolution {

    public static final int GET_STRUCTURE_TIMEOUT_SECONDS = 10;

    private final DatasourceService datasourceService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PluginService pluginService;
    private final DatasourceContextService datasourceContextService;
    private final EncryptionService encryptionService;
    private final CustomDatasourceRepository datasourceRepository;

    public Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache) {
        return datasourceService.getById(datasourceId)
                .flatMap(datasource -> getStructure(datasource, ignoreCache))
                .defaultIfEmpty(new DatasourceStructure())
                .onErrorMap(
                        IllegalArgumentException.class,
                        error ->
                                new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                        error.getMessage()
                                )
                )
                .onErrorMap(e -> {
                    if(!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, e.getMessage());
                    }

                    return e;
                });
    }

    private Mono<DatasourceStructure> getStructure(Datasource datasource, boolean ignoreCache) {
        if (!CollectionUtils.isEmpty(datasource.getInvalids())) {
            // Don't attempt to get structure for invalid datasources.
            return Mono.empty();
        }

        if (!ignoreCache && datasource.getStructure() != null) {
            // Return the cached structure if available.
            return Mono.just(datasource.getStructure());
        }

        decryptEncryptedFieldsInDatasource(datasource);

        // This mono, when computed, will load the structure of the datasource by calling the plugin method.
        return pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasource.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())))
                .flatMap(pluginExecutor -> datasourceContextService
                        .retryOnce(
                                datasource,
                                resourceContext -> ((PluginExecutor<Object>) pluginExecutor)
                                        .getStructure(resourceContext.getConnection(), datasource.getDatasourceConfiguration())
                        )
                )
                .timeout(Duration.ofSeconds(GET_STRUCTURE_TIMEOUT_SECONDS))
                .onErrorMap(
                        TimeoutException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_TIMEOUT_ERROR,
                                "Timed out when fetching structure"
                        )
                )
                .onErrorMap(
                        StaleConnectionException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                "Secondary stale connection error."
                        )
                )
                .onErrorMap(
                        IllegalArgumentException.class,
                        error ->
                                new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                        error.getMessage()
                                )
                )
                .onErrorMap(e -> {
                    log.error("In the datasource structure error mode.", e);

                    if(!(e instanceof AppsmithPluginException)) {
                        return new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, e.getMessage());
                    }

                    return e;
                })
                .flatMap(structure -> datasource.getId() == null
                        ? Mono.empty()
                        : datasourceRepository.saveStructure(datasource.getId(), structure).thenReturn(structure)
                );
    }

    private Datasource decryptEncryptedFieldsInDatasource(Datasource datasource) {
        // If datasource has encrypted fields, decrypt and set it in the datasource.
        if (datasource.getDatasourceConfiguration() != null) {
            AuthenticationDTO authentication = datasource.getDatasourceConfiguration().getAuthentication();
            if (authentication != null && authentication.isEncrypted()) {
                Map<String, String> decryptedFields = authentication.getEncryptionFields().entrySet().stream()
                        .filter(e -> e.getValue() != null)
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                e -> encryptionService.decryptString(e.getValue())));
                authentication.setEncryptionFields(decryptedFields);
                authentication.setIsEncrypted(false);
            }
        }

        return datasource;
    }

}
