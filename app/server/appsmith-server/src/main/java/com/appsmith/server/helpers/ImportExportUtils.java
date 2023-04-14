package com.appsmith.server.helpers;

import static com.appsmith.external.constants.GitConstants.NAME_SEPARATOR;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.appsmith.external.interfaces.DeletableResource;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.migrations.JsonSchemaVersions;

public class ImportExportUtils {

    /**
     * This function checks whether serialisation is for version control
     * 
     * @param serialiseFor objective of serialisation
     * @return true if serialisation is for version control, false otherwise
     */
    public static boolean isGitSync(SerialiseApplicationObjective serialiseFor) {
        return SerialiseApplicationObjective.VERSION_CONTROL.equals(serialiseFor);
    }

    /**
     * This function checks whether serialisation is for file export
     * 
     * @param serialiseFor objective of serialisation
     * @return true if serialisation is for file export, false otherwise
     */
    public static boolean isFileExport(SerialiseApplicationObjective serialiseFor) {
        return SerialiseApplicationObjective.SHARE.equals(serialiseFor);
    }

    /**
     * This function checks whether the resource is updated after last commit
     * 
     * @param application application object
     * @param resource    resource object
     * @return true if resource is updated after last commit, false otherwise
     */
    public static boolean isResourceUpdatedAfterLastCommit(Application application, BaseDomain resource) {
        Instant applicationLastCommittedAt = Instant.MIN;

        if (application.getGitApplicationMetadata() != null
                && application.getGitApplicationMetadata().getLastCommittedAt() != null) {
            // If application has git metadata and last committed at is not null then get
            // the actual value
            applicationLastCommittedAt = application.getGitApplicationMetadata().getLastCommittedAt();
        }

        boolean isClientSchemaMigrated = !JsonSchemaVersions.clientVersion.equals(application.getClientSchemaVersion());
        boolean isServerSchemaMigrated = !JsonSchemaVersions.serverVersion.equals(application.getServerSchemaVersion());

        return isClientSchemaMigrated || isServerSchemaMigrated || resource.getUpdatedAt() == null
                || applicationLastCommittedAt.isBefore(resource.getUpdatedAt());
    }

    /**
     * This function returns a set of modified custom JS libs
     * 
     * @param application  application object
     * @param customJSLibs list of custom JS libs
     * @return set of modified custom JS lib uids
     */
    public static Set<String> getUpdatedCustomJSLibsForApplication(Application application,
            List<CustomJSLib> customJSLibs) {
        return customJSLibs
                .stream()
                .filter(lib -> isResourceUpdatedAfterLastCommit(application, lib))
                .map(lib -> lib.getUidString())
                .collect(Collectors.toSet());
    }

    /**
     * This function returns a set of modified pages
     * 
     * @param application application object
     * @param pages       list of pages
     * @return set of modified page uids
     */
    public static Set<String> getUpdatedPagesForApplication(Application application, List<NewPage> pages,
            ResourceModes resourceMode) {
        // TODO make this function generic
        return pages
                .stream()
                .filter(page -> isResourceUpdatedAfterLastCommit(application, page)
                        && page.select(resourceMode).getName() != null)
                .map(page -> page.select(resourceMode).getName())
                .collect(Collectors.toSet());
    }

    /**
     * This function returns a set of modified actions
     * 
     * @param application application object
     * @param actions     list of actions
     * @return set of modified action names
     */
    public static Set<String> getUpdatedActionsForApplication(Application application, List<NewAction> actions,
            ResourceModes resourceMode) {
        return actions
                .stream()
                .filter(action -> isResourceUpdatedAfterLastCommit(application, action))
                .map(action -> action.select(resourceMode).getName() + NAME_SEPARATOR
                        + action.select(resourceMode).getPageId())
                .collect(Collectors.toSet());
    }

    /**
     * This function gets the set of updated collections for a given application
     * 
     * @param application       application object
     * @param actionCollections list of action collections
     * @return set of updated collection names
     */
    public static Set<String> getUpdatedCollectionsForApplication(Application application,
            List<ActionCollection> actionCollections, ResourceModes resourceMode) {
        return actionCollections
                .stream()
                .filter(actionCollection -> isResourceUpdatedAfterLastCommit(application, actionCollection))
                .map(actionCollection -> actionCollection.select(resourceMode).getPageId() + NAME_SEPARATOR
                        + actionCollection.select(resourceMode).getName())
                .collect(Collectors.toSet());
    }

    /**
     * This function computes the map of page id to name
     * 
     * @param pages list of pages
     * @return map of page id to name
     */
    public static Map<String, PageDTO> computePageIdToPageDTOMap(List<NewPage> pages, ResourceModes resourceMode) {
        Map<String, PageDTO> map = pages.stream()
                .map(page -> {
                    PageDTO pageDTO = page.select(resourceMode);
                    pageDTO.setId(page.getId());
                    return pageDTO;
                })
                .collect(Collectors.toMap(PageDTO::getId, Function.identity()));
        
        return Collections.unmodifiableMap(map);
    }

    /**
     * This function calculates the map of plugin id to plugin object
     * 
     * @param plugins list of plugins
     * @return map of plugin id to plugin object
     */
    public static Map<String, Plugin> computePluginIdToPluginMap(List<Plugin> plugins) {
        Map<String, Plugin> map = plugins.stream()
                .collect(Collectors.toMap(BaseDomain::getId, Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    /**
     * This function calculates the map of plugin id to plugin object
     * 
     * @param plugins list of plugins
     * @return map of plugin id to plugin object
     */
    public static Map<String, Plugin> computePluginReferenceToPluginMap(List<Plugin> plugins) {
        Map<String, Plugin> map = plugins.stream()
                .collect(Collectors.toMap(ImportExportUtils::getPluginReference, Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    /**
     * This function calculates the map of datasource id to name
     * 
     * @param datasource list of datasources
     * @return map of datasource id to name
     */
    public static Map<String, Datasource> computeDatasourceIdToDatasourceMap(List<Datasource> datasource) {
        Map<String, Datasource> map = datasource.stream()
                .collect(Collectors.toMap(Datasource::getId, Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, Datasource> computeDatasourceNameToDatasourceMap(List<Datasource> datasource) {
        Map<String, Datasource> map = datasource.stream()
                .collect(Collectors.toMap(Datasource::getName, Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    /**
     * This function calculates the map of action collection id to name
     * 
     * @param actionCollections list of action collections
     * @return map of action collection id to name
     */
    public static Map<String, ActionCollectionDTO> computeCollectionIdToCollectionDTOMap(List<ActionCollection> actionCollections,
            ResourceModes resourceMode) {
                Map<String, ActionCollectionDTO> map = actionCollections.stream()
                .map(actionCollection -> {
                    ActionCollectionDTO actionCollectionDTO = actionCollection.select(resourceMode);
                    actionCollectionDTO.setId(actionCollection.getId());
                    return actionCollectionDTO;
                })
                .collect(Collectors.toMap(ActionCollectionDTO::getId, Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }
    /**
     * This function calculates the map of action id to name
     * 
     * @param actions list of actions
     * @return map of action id to name
     */
    public static Map<String, ActionDTO> computeActionIdToActionDTOMap(List<NewAction> actions, ResourceModes resourceMode) {
        Map<String, ActionDTO> map = actions.stream()
                .map(action -> {
                    ActionDTO actionDTO = action.select(resourceMode);
                    actionDTO.setId(action.getId());
                    return actionDTO;
                })
                .collect(Collectors.toMap(ActionDTO::getId, Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, PageDTO> computePageNameToPageDTOMap(List<NewPage> pages, ResourceModes resourceMode) {
        Map<String, PageDTO> map = pages.stream()
                .map(page -> {
                    PageDTO pageDTO = page.select(resourceMode);
                    pageDTO.setId(page.getId());
                    return pageDTO;
                })
                .collect(Collectors.toMap(PageDTO::getName, Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, NewPage> computeUnpublishedPageNameToPageMap(List<NewPage> pages) {
        Map<String, NewPage> map = pages.stream()
                .filter(page -> page.getUnpublishedPage() != null && !isResourceDeleted(page.getUnpublishedPage()))
                .collect(Collectors.toMap(page -> page.getUnpublishedPage().getName(), Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, NewPage> computePublishedPageNameToPageMap(List<NewPage> pages) {
        Map<String, NewPage> map = pages.stream()
                .filter(page -> page.getPublishedPage() != null && !isResourceDeleted(page.getPublishedPage()))
                .collect(Collectors.toMap(page -> page.getPublishedPage().getName(), Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, NewAction> computeUnpublishedActionNameToActionMap(List<NewAction> actions) {
        Map<String, NewAction> map = actions.stream()
                .filter(action -> action.getUnpublishedAction() != null && !isResourceDeleted(action.getUnpublishedAction()))
                .collect(Collectors.toMap(action -> action.getUnpublishedAction().getName(), Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, NewAction> computePublishedActionNameToActionMap(List<NewAction> actions) {
        Map<String, NewAction> map = actions.stream()
                .filter(action -> action.getPublishedAction() != null && !isResourceDeleted(action.getPublishedAction()))
                .collect(Collectors.toMap(action -> action.getPublishedAction().getName(), Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, ActionCollection> computeUnpublishedCollectionNameToCollectionMap(List<ActionCollection> actionCollections) {
        Map<String, ActionCollection> map = actionCollections.stream()
                .filter(actionCollection -> actionCollection.getUnpublishedCollection() != null && !isResourceDeleted(actionCollection.getUnpublishedCollection()))
                .collect(Collectors.toMap(actionCollection -> actionCollection.getUnpublishedCollection().getName(), Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    public static Map<String, ActionCollection> computePublishedCollectionNameToCollectionMap(List<ActionCollection> actionCollections) {
        Map<String, ActionCollection> map = actionCollections.stream()
                .filter(actionCollection -> actionCollection.getPublishedCollection() != null && !isResourceDeleted(actionCollection.getPublishedCollection()))
                .collect(Collectors.toMap(actionCollection -> actionCollection.getPublishedCollection().getName(), Function.identity()));
                
        return Collections.unmodifiableMap(map);
    }

    /**
     * This utility function returns the plugin name if present, else returns the
     * package name
     * TODO find out why this is needed, can we update plugin name using migration?
     * 
     * @param plugin plugin object
     * @return plugin name
     */
    public static String getPluginReference(Plugin plugin) {
        return Optional.ofNullable(plugin.getPluginName()).orElse(plugin.getPackageName());
    }

    public static boolean isResourceDeleted(DeletableResource resource) {
        return resource == null || resource.getDeletedAt() != null;
    }

    public static class ResourceMapping {
        
    }
}
