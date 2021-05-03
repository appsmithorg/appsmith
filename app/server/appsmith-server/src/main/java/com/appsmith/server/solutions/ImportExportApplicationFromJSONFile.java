package com.appsmith.server.solutions;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJSONFile;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImportExportApplicationFromJSONFile {
    private final OrganizationRepository organizationRepository;
    private final DatasourceService datasourceService;
    private final DatasourceRepository datasourceRepository;
    private final ConfigService configService;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final NewActionRepository newActionRepository;
    private final PluginRepository pluginRepository;
    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final DatasourceContextService datasourceContextService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final LayoutActionService layoutActionService;
    private final EncryptionService encryptionService;

    Mono<ApplicationJSONFile> getApplicationFileById(String applicationId) {
        ApplicationJSONFile file = new ApplicationJSONFile();
        Map<String, String> pluginMap = new HashMap<>();
        List<Datasource> dsList = pluginRepository
                .findAll()
                .map(plugin -> pluginMap.put(plugin.getId(), plugin.getPackageName()))
                .flatMap(ignore -> applicationService.findById(applicationId, AclPermission.MANAGE_APPLICATIONS))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(application -> {
                    final String organizationId = application.getOrganizationId();
                    application.setOrganizationId(null);
                    application.setPolicies(null);
                    application.setId(null);
                    String applicationName = application.getName();
                    file.setExportedApplication(application);
                    return Flux.fromIterable(application.getPages())
                            .flatMap(applicationPage -> newPageRepository.findByApplicationId(applicationPage.getId()))
                            .collectList()
                            .map(newPageList -> {
                                newPageList.forEach(newPage -> {
                                    newPage.setApplicationId(applicationName);
                                    newPage.setPolicies(null);
                                    newPage.setId(null);
                                    if (file.getPageList().isEmpty()) {
                                        file.setPageList(Arrays.asList(newPage));
                                    } else {
                                        file.getPageList().add(file.getPageList().size(), newPage);
                                    }
                                    //Remove action ids
                                });
                                return newActionRepository.findByApplicationId(applicationId);
                            })
                            .flatMap(newActionFlux -> newActionFlux.collectList())
                            .map(newActionList -> {
                                newActionList.forEach(newAction -> {
                                    newAction.setPluginId(pluginMap.get(newAction.getPluginId()));
                                    newAction.setOrganizationId(null);
                                    newAction.setPolicies(null);
                                    newAction.setApplicationId(applicationName);
                                    if (file.getActionList().isEmpty()) {
                                        file.setActionList(Arrays.asList(newAction));
                                    } else {
                                        file.getActionList().add(file.getPageList().size(), newAction);
                                    }
                                });
                                return datasourceRepository.findAllByOrganizationId(organizationId);
                            })
                            .flatMap(datasourceFlux -> datasourceFlux.collectList())
                            .map(datasourceList -> {
                                //Only export those are used in the app instead of org level
                                datasourceList.forEach(datasource -> {
                                    //decrypt all the fields in authentication object
                                    AuthenticationDTO authentication = datasource.getDatasourceConfiguration().getAuthentication();
                                    Map<String, String> decryptedFields = authentication
                                            .getEncryptionFields()
                                            .entrySet()
                                            .stream()
                                            .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                                            .collect(Collectors.toMap(
                                                    Map.Entry::getKey,
                                                    e -> encryptionService.decryptString(e.getValue())));
                                    authentication.setEncryptionFields(decryptedFields);
                                    authentication.setIsEncrypted(false);
                                    datasource.setPluginId(pluginMap.get(datasource.getPluginId()));
                                    datasource.setOrganizationId(null);
                                    datasource.setPolicies(null);
                                    if (file.getDatasourceList().isEmpty()) {
                                        file.setDatasourceList(Arrays.asList(datasource));
                                    } else {
                                        file.getDatasourceList().add(file.getDatasourceList().size(), datasource);
                                    }
                                });
                                return datasourceList;
                            });
                });
    }

    ApplicationJSONFile removePoliciesAndDecryptPasswords(ApplicationJSONFile file) {

        file.getPageList().forEach(newPage -> newPage.setPolicies(null));
        file.getExportedApplication().setPolicies(null);
        file.getDatasourceList().forEach(datasource -> datasource.setPolicies(null));
        file.getActionList().forEach(newAction -> newAction.setPolicies(null));

        //Decrypt passwords and store back to authentication object
        file.getDatasourceList()
                .stream()
                .filter(datasource -> datasource.getDatasourceConfiguration() != null
                        && datasource.getDatasourceConfiguration().getAuthentication().isEncrypted() != null
                        && datasource.getDatasourceConfiguration().getAuthentication().isEncrypted() == true)
                .forEach(datasource -> {
                    AuthenticationDTO authentication = datasource.getDatasourceConfiguration().getAuthentication();
                    Map<String, String> decryptedFields = authentication
                            .getEncryptionFields()
                            .entrySet()
                            .stream()
                            .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                            .collect(Collectors.toMap(
                                    Map.Entry::getKey,
                                    e -> encryptionService.decryptString(e.getValue())));
                    authentication.setEncryptionFields(decryptedFields);
                    authentication.setIsEncrypted(false);
                });

        return file;
    }
}
