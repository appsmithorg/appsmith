package com.appsmith.server.solutions;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.pluginExceptions.StaleConnectionException;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.CustomDatasourceRepository;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.EncryptionService;
import com.appsmith.server.services.PluginService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
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
                .flatMap(datasource -> getStructure(datasource, ignoreCache));
    }

    public Mono<DatasourceStructure> getStructure(Datasource datasource, boolean ignoreCache) {
        // This mono, when computed, will yield the cached structure if applicable, or resolve to an empty mono.
        // If the structure is `null` inside the datasource, this will resolve to empty as well.
        final Mono<DatasourceStructure> cachedStructureMono =
                ignoreCache ? Mono.empty() : Mono.justOrEmpty(datasource.getStructure());

        decryptEncryptedFieldsInDatasource(datasource);

        // This mono, when computed, will load the structure of the datasource by calling the plugin method.
        final Mono<DatasourceStructure> loadStructureMono = pluginExecutorHelper
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
                        StaleConnectionException.class,
                        error -> new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Secondary stale connection error."
                        )
                )
                .onErrorMap(e -> {
                    log.error("In the datasource structure error mode.", e);
                    return new AppsmithPluginException(AppsmithPluginError.PLUGIN_STRUCTURE_ERROR, e.getMessage());
                })
                .flatMap(structure -> datasource.getId() == null
                        ? Mono.empty()
                        : datasourceRepository.saveStructure(datasource.getId(), structure).thenReturn(structure)
                );

        return cachedStructureMono
                .switchIfEmpty(loadStructureMono)
                .defaultIfEmpty(new DatasourceStructure());
    }

    private Datasource decryptEncryptedFieldsInDatasource(Datasource datasource) {
        // If datasource has encrypted fields, decrypt and set it in the datasource.
        if (datasource.getDatasourceConfiguration() != null) {
            AuthenticationDTO authentication = datasource.getDatasourceConfiguration().getAuthentication();
            if (authentication != null && authentication.getEmptyEncryptionFields().isEmpty() && authentication.isEncrypted()) {
                Map<String, String> decryptedFields = authentication.getEncryptionFields().entrySet().stream()
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
