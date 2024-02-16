package com.appsmith.server.helpers;

import com.appsmith.external.git.FileInterface;
import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.git.helpers.FileUtilsImpl;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ExportableModule;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.helpers.ce.GitFileUtilsCE;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.PredicateUtils;
import org.springframework.context.annotation.Import;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;
import static com.appsmith.server.constants.FieldName.MODULE_INSTANCE_LIST;
import static com.appsmith.server.constants.FieldName.SOURCE_MODULE_LIST;

@Slf4j
@Component
@Import({FileUtilsImpl.class})
public class GitFileUtils extends GitFileUtilsCE {

    private Gson gson;

    public GitFileUtils(
            FileInterface fileUtils,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            Gson gson) {
        super(fileUtils, analyticsService, sessionUserService, newActionService, actionCollectionService, gson);
        this.gson = gson;
    }

    @Override
    protected Set<String> getBlockedMetadataFields() {
        Set<String> blockedMetadataFields = super.getBlockedMetadataFields();

        Set<String> newBlockedMetaFields = new HashSet<>(blockedMetadataFields);

        newBlockedMetaFields.addAll(Set.of(MODULE_INSTANCE_LIST, SOURCE_MODULE_LIST));

        return newBlockedMetaFields;
    }

    /**
     * Method to convert application resources to the structure which can be serialised by appsmith-git module for
     * serialisation
     *
     * @param applicationJson application resource including actions, jsobjects, pages
     * @return resource which can be saved to file system
     */
    public ApplicationGitReference createApplicationReference(ApplicationJson applicationJson) {
        ApplicationGitReference applicationReference = super.createApplicationReference(applicationJson);

        setModuleInstancesInApplicationReference(applicationJson, applicationReference);

        setModulesInApplicationReference(applicationJson, applicationReference);

        return applicationReference;
    }

    private void setModulesInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        Map<String, Object> resourceMap = new HashMap<>();
        // Send modules
        if (applicationJson.getSourceModuleList() != null) {
            applicationJson.getSourceModuleList().forEach(exportableModule -> {
                resourceMap.put(
                        exportableModule.getModuleName() + NAME_SEPARATOR + exportableModule.getModuleUUID(),
                        exportableModule);
            });
        }
        applicationReference.setSourceModules(resourceMap);
    }

    private void setModuleInstancesInApplicationReference(
            ApplicationJson applicationJson, ApplicationGitReference applicationReference) {
        Map<String, Object> resourceMap = new HashMap<>();
        // Send module instances
        if (applicationJson.getModuleInstanceList() != null) {
            applicationJson.getModuleInstanceList().stream()
                    .filter(moduleInstance -> moduleInstance.getUnpublishedModuleInstance() != null
                            && moduleInstance.getUnpublishedModuleInstance().getDeletedAt() == null)
                    .forEach(moduleInstance -> {
                        String gitIdentifier = moduleInstance
                                        .getUnpublishedModuleInstance()
                                        .getName()
                                + NAME_SEPARATOR
                                + moduleInstance.getUnpublishedModuleInstance().getPageId();
                        removeUnwantedFieldsFromModuleInstance(moduleInstance);
                        resourceMap.put(gitIdentifier, moduleInstance);
                    });
        }
        applicationReference.setModuleInstances(resourceMap);
    }

    private void removeUnwantedFieldsFromModuleInstance(ModuleInstance moduleInstance) {
        moduleInstance.setPublishedModuleInstance(null);
        removeUnwantedFieldsFromBaseDomain(moduleInstance);
    }

    @Override
    protected ApplicationJson getApplicationJsonFromGitReference(ApplicationGitReference applicationReference) {
        ApplicationJson applicationJson = super.getApplicationJsonFromGitReference(applicationReference);

        setModuleInstancesInApplicationJson(applicationReference, applicationJson);

        setSourceModulesInApplicationJson(applicationReference, applicationJson);

        return applicationJson;
    }

    private void setSourceModulesInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        // Extract source modules
        if (!CollectionUtils.isNullOrEmpty(applicationReference.getSourceModules())) {
            applicationJson.setSourceModuleList(
                    getApplicationResource(applicationReference.getSourceModules(), ExportableModule.class));
        }
    }

    private void setModuleInstancesInApplicationJson(
            ApplicationGitReference applicationReference, ApplicationJson applicationJson) {
        // Extract module instances
        if (!CollectionUtils.isNullOrEmpty(applicationReference.getModuleInstances())) {
            List<ModuleInstance> moduleInstances =
                    getApplicationResource(applicationReference.getModuleInstances(), ModuleInstance.class);
            // Remove null values if present
            org.apache.commons.collections.CollectionUtils.filter(moduleInstances, PredicateUtils.notNullPredicate());
            moduleInstances.forEach(moduleInstance -> {
                // As we are publishing the app and then committing to git we expect the published and unpublished
                // moduleInstanceDTO will be same, so we create a deep copy for the published version for action from
                // unpublishedModuleInstanceDTO
                moduleInstance.setPublishedModuleInstance(gson.fromJson(
                        gson.toJson(moduleInstance.getUnpublishedModuleInstance()), ModuleInstanceDTO.class));
            });
            applicationJson.setModuleInstanceList(moduleInstances);
        }
    }
}
