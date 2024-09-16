package com.appsmith.server.migrations;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.InvisibleActionFields;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.ApplicationConstants;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationDetail;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.minidev.json.JSONObject;
import org.apache.commons.lang.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.util.ObjectUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.ResourceModes.EDIT;
import static com.appsmith.server.constants.ResourceModes.VIEW;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

public class MigrationHelperMethods {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern sheetRangePattern =
            Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?[^\"]*");

    // Migration for deprecating archivedAt field in ActionDTO
    public static void updateArchivedAtByDeletedATForActions(List<NewAction> actionList) {
        for (NewAction newAction : actionList) {
            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
            if (unpublishedAction != null) {
                final Instant archivedAt = unpublishedAction.getArchivedAt();
                unpublishedAction.setDeletedAt(archivedAt);
                unpublishedAction.setArchivedAt(null);
            }
        }
    }

    public static void migrateActionFormDataToObject(ApplicationJson applicationJson) {
        final List<NewAction> actionList = applicationJson.getActionList();

        if (!CollectionUtils.isNullOrEmpty(actionList)) {
            actionList.parallelStream().forEach(newAction -> {
                // determine plugin
                final String pluginName = newAction.getPluginId();
                if ("mongo-plugin".equals(pluginName)) {
                    migrateMongoActionsFormData(newAction);
                } else if ("amazons3-plugin".equals(pluginName)) {
                    migrateAmazonS3ActionsFormData(newAction);
                } else if ("firestore-plugin".equals(pluginName)) {
                    migrateFirestoreActionsFormData(newAction);
                }
            });
        }
    }

    // Method to embed application pages in imported application object as per modified serialization format where we
    // are serialising JsonIgnored fields to keep the relevant data with domain objects only
    public static void arrangeApplicationPagesAsPerImportedPageOrder(ApplicationJson applicationJson) {

        Map<ResourceModes, List<ApplicationPage>> applicationPages = Map.of(
                EDIT, new ArrayList<>(),
                VIEW, new ArrayList<>());
        // Reorder the pages based on edit mode page sequence
        List<String> pageOrderList;
        if (!CollectionUtils.isNullOrEmpty(applicationJson.getPageOrder())) {
            pageOrderList = applicationJson.getPageOrder();
        } else {
            pageOrderList = applicationJson.getPageList().parallelStream()
                    .filter(newPage -> newPage.getUnpublishedPage() != null
                            && newPage.getUnpublishedPage().getDeletedAt() == null)
                    .map(newPage -> newPage.getUnpublishedPage().getName())
                    .collect(Collectors.toList());
        }
        for (String pageName : pageOrderList) {
            ApplicationPage unpublishedAppPage = new ApplicationPage();
            unpublishedAppPage.setId(pageName);
            unpublishedAppPage.setIsDefault(
                    StringUtils.equals(pageName, applicationJson.getUnpublishedDefaultPageName()));
            applicationPages.get(EDIT).add(unpublishedAppPage);
        }

        // Reorder the pages based on view mode page sequence
        pageOrderList.clear();
        if (!CollectionUtils.isNullOrEmpty(applicationJson.getPublishedPageOrder())) {
            pageOrderList = applicationJson.getPublishedPageOrder();
        } else {
            pageOrderList = applicationJson.getPageList().parallelStream()
                    .filter(newPage -> newPage.getPublishedPage() != null
                            && !StringUtils.isEmpty(newPage.getPublishedPage().getName()))
                    .map(newPage -> newPage.getPublishedPage().getName())
                    .collect(Collectors.toList());
        }
        for (String pageName : pageOrderList) {
            ApplicationPage publishedAppPage = new ApplicationPage();
            publishedAppPage.setId(pageName);
            publishedAppPage.setIsDefault(StringUtils.equals(pageName, applicationJson.getPublishedDefaultPageName()));
            applicationPages.get(VIEW).add(publishedAppPage);
        }
        applicationJson.getExportedApplication().setPages(applicationPages.get(EDIT));
        applicationJson.getExportedApplication().setPublishedPages(applicationPages.get(VIEW));
    }

    // Method to embed mongo escaped widgets in imported layouts as per modified serialization format where we are
    // serialising JsonIgnored fields to keep the relevant data with domain objects only
    public static void updateMongoEscapedWidget(ApplicationJson applicationJson) {
        Map<String, Set<String>> unpublishedMongoEscapedWidget =
                CollectionUtils.isNullOrEmpty(applicationJson.getUnpublishedLayoutmongoEscapedWidgets())
                        ? new HashMap<>()
                        : applicationJson.getUnpublishedLayoutmongoEscapedWidgets();

        Map<String, Set<String>> publishedMongoEscapedWidget =
                CollectionUtils.isNullOrEmpty(applicationJson.getPublishedLayoutmongoEscapedWidgets())
                        ? new HashMap<>()
                        : applicationJson.getPublishedLayoutmongoEscapedWidgets();

        applicationJson.getPageList().parallelStream().forEach(newPage -> {
            if (newPage.getUnpublishedPage() != null
                    && unpublishedMongoEscapedWidget.containsKey(
                            newPage.getUnpublishedPage().getName())
                    && !CollectionUtils.isNullOrEmpty(
                            newPage.getUnpublishedPage().getLayouts())) {

                newPage.getUnpublishedPage().getLayouts().forEach(layout -> {
                    layout.setMongoEscapedWidgetNames(unpublishedMongoEscapedWidget.get(layout.getId()));
                });
            }

            if (newPage.getPublishedPage() != null
                    && publishedMongoEscapedWidget.containsKey(
                            newPage.getPublishedPage().getName())
                    && !CollectionUtils.isNullOrEmpty(newPage.getPublishedPage().getLayouts())) {

                newPage.getPublishedPage().getLayouts().forEach(layout -> {
                    layout.setMongoEscapedWidgetNames(publishedMongoEscapedWidget.get(layout.getId()));
                });
            }
        });
    }

    // Method to embed userSetOnLoad in imported actions as per modified serialization format where we are serialising
    // JsonIgnored fields to keep the relevant data with domain objects only
    public static void updateUserSetOnLoadAction(ApplicationJson applicationJson) {
        Map<String, InvisibleActionFields> invisibleActionFieldsMap = applicationJson.getInvisibleActionFields();
        if (invisibleActionFieldsMap != null) {
            applicationJson.getActionList().parallelStream().forEach(newAction -> {
                if (newAction.getUnpublishedAction() != null) {
                    newAction
                            .getUnpublishedAction()
                            .setUserSetOnLoad(invisibleActionFieldsMap
                                    .get(newAction.getId())
                                    .getUnpublishedUserSetOnLoad());
                }
                if (newAction.getPublishedAction() != null) {
                    newAction
                            .getPublishedAction()
                            .setUserSetOnLoad(invisibleActionFieldsMap
                                    .get(newAction.getId())
                                    .getPublishedUserSetOnLoad());
                }
            });
        }
    }

    public static void migrateGoogleSheetsActionsToUqi(ApplicationJson applicationJson) {
        final List<NewAction> actionList = applicationJson.getActionList();

        if (!CollectionUtils.isNullOrEmpty(actionList)) {
            actionList.parallelStream().forEach(newAction -> {
                // Determine plugin
                final String pluginName = newAction.getPluginId();
                if ("google-sheets-plugin".equals(pluginName)) {
                    migrateGoogleSheetsToUqi(newAction);
                }
            });
        }
    }

    public static void evictPermissionCacheForUsers(
            Set<String> userIds, MongoTemplate mongoTemplate, CacheableRepositoryHelper cacheableRepositoryHelper) {

        if (userIds == null || userIds.isEmpty()) {
            // Nothing to do here.
            return;
        }

        userIds.forEach(userId -> {
            Query query = new Query(new Criteria(User.Fields.id).is(userId));
            User user = mongoTemplate.findOne(query, User.class);
            if (user != null) {
                // blocking call for cache eviction to ensure its subscribed immediately before proceeding further.
                cacheableRepositoryHelper
                        .evictPermissionGroupsUser(user.getEmail(), user.getTenantId())
                        .block();
            }
        });
    }

    public static Query getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(Plugin plugin) {
        Criteria pluginIdMatchesSuppliedPluginId = where("pluginId").is(plugin.getId());
        Criteria isNotDeleted = where("deleted").ne(true);
        return query((new Criteria()).andOperator(pluginIdMatchesSuppliedPluginId, isNotDeleted));
    }

    /**
     * Here 'id' refers to the ObjectId which is used to uniquely identify each Mongo document. 'path' refers to the
     * path in the Query DSL object that indicates which field in a document should be matched against the `id`.
     * `type` is a POJO class type that indicates which collection we are interested in. eg. path=QNewAction
     * .newAction.id, type=NewAction.class
     */
    public static <T extends BaseDomain> List<T> fetchAllDomainObjectsUsingId(
            String id, MongoTemplate mongoTemplate, String path, Class<T> type) {
        final List<T> domainObject = mongoTemplate.find(query(where(path).is(id)), type);
        return domainObject;
    }

    /**
     * This method takes customJSLibList from application JSON, checks if an entry for XML parser exists,
     * otherwise adds the entry.
     * This has been done to add the xmlParser entry in imported application as appsmith is stopping native support
     * for xml parser.
     * Read More: https://github.com/appsmithorg/appsmith/pull/28012
     *
     * @param applicationJson
     */
    public static void ensureXmlParserPresenceInCustomJsLibList(ApplicationJson applicationJson) {

        if (CollectionUtils.isNullOrEmpty(applicationJson.getCustomJSLibList())) {
            applicationJson.setCustomJSLibList(new ArrayList<>());
        }

        List<CustomJSLib> customJSLibList = applicationJson.getCustomJSLibList();
        boolean isXmlParserLibFound = false;

        for (CustomJSLib customJSLib : customJSLibList) {
            if (!customJSLib.getUidString().equals(ApplicationConstants.XML_PARSER_LIBRARY_UID)) {
                continue;
            }

            isXmlParserLibFound = true;
            break;
        }

        if (!isXmlParserLibFound) {
            CustomJSLib xmlParserJsLib = ApplicationConstants.getDefaultParserCustomJsLibCompatibilityDTO();
            customJSLibList.add(xmlParserJsLib);
        }
    }

    private static void migrateMongoActionsFormData(NewAction uqiAction) {
        ActionDTO unpublishedAction = uqiAction.getUnpublishedAction();
        /**
         * Migrate unpublished action configuration data.
         */
        Map<String, Object> newUnpublishedFormDataMap = new HashMap<>();
        mapMongoToNewFormData(unpublishedAction, newUnpublishedFormDataMap);
        unpublishedAction.getActionConfiguration().setFormData(newUnpublishedFormDataMap);

        ActionDTO publishedAction = uqiAction.getPublishedAction();
        /**
         * Migrate published action configuration data.
         */
        if (publishedAction.getActionConfiguration() != null) {
            Map<String, Object> newPublishedFormDataMap = new HashMap<>();
            mapMongoToNewFormData(publishedAction, newPublishedFormDataMap);
            publishedAction.getActionConfiguration().setFormData(newPublishedFormDataMap);
        }

        /**
         * Migrate the dynamic binding path list for unpublished action.
         * Please note that there is no requirement to migrate the dynamic binding path
         * list for published actions
         * since the `on page load` actions do not get computed on published actions
         * data. They are only computed
         * on unpublished actions data and copied over for the view mode.
         */
        List<Property> dynamicBindingPathList = unpublishedAction.getDynamicBindingPathList();
        if (dynamicBindingPathList != null && !dynamicBindingPathList.isEmpty()) {
            Map<String, String> dynamicBindingMapper = new HashMap<>();
            dynamicBindingMapper.put("formData.command", "formData.command.data");
            dynamicBindingMapper.put("formData.collection", "formData.collection.data");
            dynamicBindingMapper.put("formData.aggregate.arrayPipelines", "formData.aggregate.arrayPipelines.data");
            dynamicBindingMapper.put("formData.aggregate.limit", "formData.aggregate.limit.data");
            dynamicBindingMapper.put("formData.count.query", "formData.count.query.data");
            dynamicBindingMapper.put("formData.delete.query", "formData.delete.query.data");
            dynamicBindingMapper.put("formData.delete.limit", "formData.delete.limit.data");
            dynamicBindingMapper.put("formData.distinct.query", "formData.distinct.query.data");
            dynamicBindingMapper.put("formData.distinct.key", "formData.distinct.key.data");
            dynamicBindingMapper.put("formData.find.query", "formData.find.query.data");
            dynamicBindingMapper.put("formData.find.sort", "formData.find.sort.data");
            dynamicBindingMapper.put("formData.find.projection", "formData.find.projection.data");
            dynamicBindingMapper.put("formData.find.limit", "formData.find.limit.data");
            dynamicBindingMapper.put("formData.find.skip", "formData.find.skip.data");
            dynamicBindingMapper.put("formData.insert.documents", "formData.insert.documents.data");
            dynamicBindingMapper.put("formData.updateMany.query", "formData.updateMany.query.data");
            dynamicBindingMapper.put("formData.updateMany.update", "formData.updateMany.update.data");
            dynamicBindingMapper.put("formData.updateMany.limit", "formData.updateMany.limit.data");
            dynamicBindingMapper.put("formData.smartSubstitution", "formData.smartSubstitution.data");
            dynamicBindingMapper.put("body", "formData.body.data");
            dynamicBindingPathList.stream().forEach(dynamicBindingPath -> {
                final String currentBinding = dynamicBindingPath.getKey();
                final Optional<String> matchingBinding = dynamicBindingMapper.keySet().stream()
                        .filter(currentBinding::startsWith)
                        .findFirst();
                if (matchingBinding.isPresent()) {
                    final String newBindingPrefix = dynamicBindingMapper.get(matchingBinding.get());
                    dynamicBindingPath.setKey(currentBinding.replace(matchingBinding.get(), newBindingPrefix));
                }
            });
        }
    }

    private static void migrateAmazonS3ActionsFormData(NewAction uqiAction) {
        ActionDTO unpublishedAction = uqiAction.getUnpublishedAction();
        /**
         * Migrate unpublished action configuration data.
         */
        Map<String, Object> newUnpublishedFormDataMap = new HashMap<>();
        mapS3ToNewFormData(unpublishedAction, newUnpublishedFormDataMap);
        unpublishedAction.getActionConfiguration().setFormData(newUnpublishedFormDataMap);

        ActionDTO publishedAction = uqiAction.getPublishedAction();
        /**
         * Migrate published action configuration data.
         */
        if (publishedAction.getActionConfiguration() != null) {
            Map<String, Object> newPublishedFormDataMap = new HashMap<>();
            mapS3ToNewFormData(publishedAction, newPublishedFormDataMap);
            publishedAction.getActionConfiguration().setFormData(newPublishedFormDataMap);
        }

        /**
         * Migrate the dynamic binding path list for unpublished action.
         * Please note that there is no requirement to migrate the dynamic binding path
         * list for published actions
         * since the `on page load` actions do not get computed on published actions
         * data. They are only computed
         * on unpublished actions data and copied over for the view mode.
         */
        List<Property> dynamicBindingPathList = unpublishedAction.getDynamicBindingPathList();
        if (dynamicBindingPathList != null && !dynamicBindingPathList.isEmpty()) {
            Map<String, String> dynamicBindingMapper = new HashMap<>();
            dynamicBindingMapper.put("formData.command", "formData.command.data");
            dynamicBindingMapper.put("formData.bucket", "formData.bucket.data");
            dynamicBindingMapper.put("formData.create.dataType", "formData.create.dataType.data");
            dynamicBindingMapper.put("formData.create.expiry", "formData.create.expiry.data");
            dynamicBindingMapper.put("formData.delete.expiry", "formData.delete.expiry.data");
            dynamicBindingMapper.put("formData.list.prefix", "formData.list.prefix.data");
            dynamicBindingMapper.put("formData.list.where", "formData.list.where.data");
            dynamicBindingMapper.put("formData.list.signedUrl", "formData.list.signedUrl.data");
            dynamicBindingMapper.put("formData.list.expiry", "formData.list.expiry.data");
            dynamicBindingMapper.put("formData.list.unSignedUrl", "formData.list.unSignedUrl.data");
            dynamicBindingMapper.put("formData.list.sortBy", "formData.list.sortBy.data");
            dynamicBindingMapper.put("formData.list.pagination", "formData.list.pagination.data");
            dynamicBindingMapper.put("formData.read.usingBase64Encoding", "formData.read.dataType.data");
            dynamicBindingMapper.put("formData.read.expiry", "formData.read.expiry.data");
            dynamicBindingMapper.put("formData.smartSubstitution", "formData.smartSubstitution.data");
            dynamicBindingMapper.put("body", "formData.body.data");
            dynamicBindingMapper.put("path", "formData.path.data");
            dynamicBindingPathList.stream().forEach(dynamicBindingPath -> {
                final String currentBinding = dynamicBindingPath.getKey();
                final Optional<String> matchingBinding = dynamicBindingMapper.keySet().stream()
                        .filter(currentBinding::startsWith)
                        .findFirst();
                if (matchingBinding.isPresent()) {
                    final String newBindingPrefix = dynamicBindingMapper.get(matchingBinding.get());
                    dynamicBindingPath.setKey(currentBinding.replace(matchingBinding.get(), newBindingPrefix));
                }
            });
        }
    }

    private static void mapMongoToNewFormData(ActionDTO action, Map<String, Object> f) {
        final Map<String, Object> formData = action.getActionConfiguration().getFormData();
        if (formData == null) {
            return;
        }

        final Object command = formData.get("command");
        if (command == null) {
            return;
        }

        if (!(command instanceof String)) {
            throw new AppsmithException(AppsmithError.MIGRATION_ERROR);
        }

        final String body = action.getActionConfiguration().getBody();
        if (org.springframework.util.StringUtils.hasLength(body)) {
            convertToFormDataObject(f, "body", body);
            action.getActionConfiguration().setBody(null);
        }

        convertToFormDataObject(f, "command", command);
        convertToFormDataObject(f, "collection", formData.get("collection"));
        convertToFormDataObject(f, "smartSubstitution", formData.get("smartSubstitution"));
        switch ((String) command) {
            case "AGGREGATE":
                final Map aggregateMap = (Map) formData.get("aggregate");
                if (aggregateMap == null) {
                    break;
                }
                final Map<String, Object> newAggregateMap = new HashMap<>();
                f.put("aggregate", newAggregateMap);
                convertToFormDataObject(newAggregateMap, "arrayPipelines", aggregateMap.get("arrayPipelines"));
                convertToFormDataObject(newAggregateMap, "limit", aggregateMap.get("limit"));
                break;
            case "COUNT":
                final Map countMap = (Map) formData.get("count");
                if (countMap == null) {
                    break;
                }
                final Map<String, Object> newCountMap = new HashMap<>();
                f.put("count", newCountMap);
                convertToFormDataObject(newCountMap, "query", countMap.get("query"));
                break;
            case "DELETE":
                final Map deleteMap = (Map) formData.get("delete");
                if (deleteMap == null) {
                    break;
                }
                final Map<String, Object> newDeleteMap = new HashMap<>();
                f.put("delete", newDeleteMap);
                convertToFormDataObject(newDeleteMap, "query", deleteMap.get("query"));
                convertToFormDataObject(newDeleteMap, "limit", deleteMap.get("limit"));
                break;
            case "DISTINCT":
                final Map distinctMap = (Map) formData.get("distinct");
                if (distinctMap == null) {
                    break;
                }
                final Map<String, Object> newDistinctMap = new HashMap<>();
                f.put("distinct", newDistinctMap);
                convertToFormDataObject(newDistinctMap, "query", distinctMap.get("query"));
                convertToFormDataObject(newDistinctMap, "key", distinctMap.get("key"));
                break;
            case "FIND":
                final Map findMap = (Map) formData.get("find");
                if (findMap == null) {
                    break;
                }
                final Map<String, Object> newFindMap = new HashMap<>();
                f.put("find", newFindMap);
                convertToFormDataObject(newFindMap, "query", findMap.get("query"));
                convertToFormDataObject(newFindMap, "sort", findMap.get("sort"));
                convertToFormDataObject(newFindMap, "projection", findMap.get("projection"));
                convertToFormDataObject(newFindMap, "limit", findMap.get("limit"));
                convertToFormDataObject(newFindMap, "skip", findMap.get("skip"));
                break;
            case "INSERT":
                final Map insertMap = (Map) formData.get("insert");
                if (insertMap == null) {
                    break;
                }
                final Map<String, Object> newInsertMap = new HashMap<>();
                f.put("insert", newInsertMap);
                convertToFormDataObject(newInsertMap, "documents", insertMap.get("documents"));
                break;
            case "UPDATE":
                final Map updateMap = (Map) formData.get("updateMany");
                if (updateMap == null) {
                    break;
                }
                final Map<String, Object> newUpdateManyMap = new HashMap<>();
                f.put("updateMany", newUpdateManyMap);
                convertToFormDataObject(newUpdateManyMap, "query", updateMap.get("query"));
                convertToFormDataObject(newUpdateManyMap, "update", updateMap.get("update"));
                convertToFormDataObject(newUpdateManyMap, "limit", updateMap.get("limit"));
                break;
        }
    }

    private static void migrateFirestoreActionsFormData(NewAction uqiAction) {
        ActionDTO unpublishedAction = uqiAction.getUnpublishedAction();
        /**
         * Migrate unpublished action configuration data.
         */
        final Map<String, Object> unpublishedFormData =
                unpublishedAction.getActionConfiguration().getFormData();

        if (unpublishedFormData != null) {
            final Object command = unpublishedFormData.get("command");

            if (!(command instanceof String)) {
                throw new AppsmithException(AppsmithError.MIGRATION_ERROR);
            }

            unpublishedFormData.keySet().stream().forEach(k -> {
                if (k != null) {
                    final Object oldValue = unpublishedFormData.get(k);
                    final HashMap<String, Object> map = new HashMap<>();
                    map.put("data", oldValue);
                    map.put("componentData", oldValue);
                    map.put("viewType", "component");
                    unpublishedFormData.put(k, map);
                }
            });
        }

        final String unpublishedBody =
                unpublishedAction.getActionConfiguration().getBody();
        if (org.springframework.util.StringUtils.hasLength(unpublishedBody)) {
            convertToFormDataObject(unpublishedFormData, "body", unpublishedBody);
            unpublishedAction.getActionConfiguration().setBody(null);
        }

        final String unpublishedPath =
                unpublishedAction.getActionConfiguration().getPath();
        if (org.springframework.util.StringUtils.hasLength(unpublishedPath)) {
            convertToFormDataObject(unpublishedFormData, "path", unpublishedPath);
            unpublishedAction.getActionConfiguration().setPath(null);
        }

        final String unpublishedNext =
                unpublishedAction.getActionConfiguration().getNext();
        if (org.springframework.util.StringUtils.hasLength(unpublishedNext)) {
            convertToFormDataObject(unpublishedFormData, "next", unpublishedNext);
            unpublishedAction.getActionConfiguration().setNext(null);
        }

        final String unpublishedPrev =
                unpublishedAction.getActionConfiguration().getPrev();
        if (org.springframework.util.StringUtils.hasLength(unpublishedPrev)) {
            convertToFormDataObject(unpublishedFormData, "prev", unpublishedPrev);
            unpublishedAction.getActionConfiguration().setPrev(null);
        }

        /**
         * Migrate published action configuration data.
         */
        ActionDTO publishedAction = uqiAction.getPublishedAction();
        if (publishedAction != null
                && publishedAction.getActionConfiguration() != null
                && publishedAction.getActionConfiguration().getFormData() != null) {
            final Map<String, Object> publishedFormData =
                    publishedAction.getActionConfiguration().getFormData();

            final Object command = publishedFormData.get("command");

            if (!(command instanceof String)) {
                throw new AppsmithException(AppsmithError.MIGRATION_ERROR);
            }

            publishedFormData.keySet().stream().forEach(k -> {
                if (k != null) {
                    final Object oldValue = publishedFormData.get(k);
                    final HashMap<String, Object> map = new HashMap<>();
                    map.put("data", oldValue);
                    map.put("componentData", oldValue);
                    map.put("viewType", "component");
                    publishedFormData.put(k, map);
                }
            });

            final String publishedBody =
                    publishedAction.getActionConfiguration().getBody();
            if (org.springframework.util.StringUtils.hasLength(publishedBody)) {
                convertToFormDataObject(publishedFormData, "body", publishedBody);
                publishedAction.getActionConfiguration().setBody(null);
            }

            final String publishedPath =
                    publishedAction.getActionConfiguration().getPath();
            if (org.springframework.util.StringUtils.hasLength(publishedPath)) {
                convertToFormDataObject(publishedFormData, "path", publishedPath);
                publishedAction.getActionConfiguration().setPath(null);
            }

            final String publishedNext =
                    publishedAction.getActionConfiguration().getNext();
            if (org.springframework.util.StringUtils.hasLength(publishedNext)) {
                convertToFormDataObject(publishedFormData, "next", publishedNext);
                publishedAction.getActionConfiguration().setNext(null);
            }

            final String publishedPrev =
                    publishedAction.getActionConfiguration().getPrev();
            if (org.springframework.util.StringUtils.hasLength(publishedPrev)) {
                convertToFormDataObject(publishedFormData, "prev", publishedPrev);
                publishedAction.getActionConfiguration().setPrev(null);
            }
        }

        /**
         * Migrate the dynamic binding path list for unpublished action.
         * Please note that there is no requirement to migrate the dynamic binding path
         * list for published actions
         * since the `on page load` actions do not get computed on published actions
         * data. They are only computed
         * on unpublished actions data and copied over for the view mode.
         */
        List<Property> dynamicBindingPathList = unpublishedAction.getDynamicBindingPathList();
        if (dynamicBindingPathList != null && !dynamicBindingPathList.isEmpty()) {
            dynamicBindingPathList.stream().forEach(dynamicBindingPath -> {
                if (dynamicBindingPath.getKey().contains("formData")) {
                    final String oldKey = dynamicBindingPath.getKey();
                    final Pattern pattern = Pattern.compile("formData\\.([^.]*)(\\..*)?");

                    Matcher matcher = pattern.matcher(oldKey);

                    while (matcher.find()) {
                        final String fieldName = matcher.group(1);
                        final String remainderPath = matcher.group(2) == null ? "" : matcher.group(2);

                        dynamicBindingPath.setKey("formData." + fieldName + ".data" + remainderPath);
                    }
                } else {
                    final String oldKey = dynamicBindingPath.getKey();
                    final Pattern pattern = Pattern.compile("^(body|next|prev|path)(\\..*)?");

                    Matcher matcher = pattern.matcher(oldKey);

                    while (matcher.find()) {
                        final String fieldName = matcher.group(1);
                        final String remainderPath = matcher.group(2) == null ? "" : matcher.group(2);

                        dynamicBindingPath.setKey("formData." + fieldName + ".data" + remainderPath);
                    }
                }
            });
        }
    }

    private static void migrateGoogleSheetsToUqi(NewAction uqiAction) {

        final Map<Integer, List<String>> googleSheetsMigrationMap = Map.ofEntries(
                Map.entry(0, List.of("command.data", "entityType.data")),
                Map.entry(1, List.of("sheetUrl.data")),
                Map.entry(2, List.of("range.data")),
                Map.entry(3, List.of("spreadsheetName.data")),
                Map.entry(4, List.of("tableHeaderIndex.data")),
                Map.entry(5, List.of("queryFormat.data")),
                Map.entry(6, List.of("pagination.data.limit")),
                Map.entry(7, List.of("sheetName.data")),
                Map.entry(8, List.of("pagination.data.offset")),
                Map.entry(9, List.of("rowObjects.data")),
                Map.entry(10, List.of("rowObjects.data")),
                Map.entry(11, List.of("rowIndex.data")),
                Map.entry(12, List.of("")), // We do not expect deleteFormat to have been dynamically bound at all
                Map.entry(13, List.of("smartSubstitution.data")),
                Map.entry(14, List.of("where.data")));

        ActionDTO unpublishedAction = uqiAction.getUnpublishedAction();
        /**
         * Migrate unpublished action configuration data.
         */
        Map<String, Object> newUnpublishedFormDataMap = new HashMap<>();
        mapGoogleSheetsToNewFormData(unpublishedAction, newUnpublishedFormDataMap);
        unpublishedAction.getActionConfiguration().setFormData(newUnpublishedFormDataMap);

        ActionDTO publishedAction = uqiAction.getPublishedAction();
        /**
         * Migrate published action configuration data.
         */
        if (publishedAction.getActionConfiguration() != null) {
            Map<String, Object> newPublishedFormDataMap = new HashMap<>();
            mapGoogleSheetsToNewFormData(publishedAction, newPublishedFormDataMap);
            publishedAction.getActionConfiguration().setFormData(newPublishedFormDataMap);
        }

        List<Property> dynamicBindingPathList = unpublishedAction.getDynamicBindingPathList();
        List<Property> newDynamicBindingPathList = getUpdatedDynamicBindingPathList(
                dynamicBindingPathList, objectMapper, uqiAction, googleSheetsMigrationMap);
        unpublishedAction.setDynamicBindingPathList(newDynamicBindingPathList);
    }

    private static void mapS3ToNewFormData(ActionDTO action, Map<String, Object> f) {
        final Map<String, Object> formData = action.getActionConfiguration().getFormData();

        if (formData == null) {
            return;
        }

        final Object command = formData.get("command");
        if (command == null) {
            return;
        }

        if (!(command instanceof String)) {
            throw new AppsmithException(AppsmithError.MIGRATION_ERROR);
        }

        final String body = action.getActionConfiguration().getBody();
        if (org.springframework.util.StringUtils.hasLength(body)) {
            convertToFormDataObject(f, "body", body);
            action.getActionConfiguration().setBody(null);
        }

        final String path = action.getActionConfiguration().getPath();
        if (org.springframework.util.StringUtils.hasLength(path)) {
            convertToFormDataObject(f, "path", path);
            action.getActionConfiguration().setPath(null);
        }

        convertToFormDataObject(f, "command", command);
        convertToFormDataObject(f, "bucket", formData.get("bucket"));
        convertToFormDataObject(f, "smartSubstitution", formData.get("smartSubstitution"));
        switch ((String) command) {
                // No case for delete single and multiple since they only had bucket that needed
                // migration
            case "LIST":
                final Map listMap = (Map) formData.get("list");
                if (listMap == null) {
                    break;
                }
                final Map<String, Object> newListMap = new HashMap<>();
                f.put("list", newListMap);
                convertToFormDataObject(newListMap, "prefix", listMap.get("prefix"));
                convertToFormDataObject(newListMap, "where", listMap.get("where"));
                convertToFormDataObject(newListMap, "signedUrl", listMap.get("signedUrl"));
                convertToFormDataObject(newListMap, "expiry", listMap.get("expiry"));
                convertToFormDataObject(newListMap, "unSignedUrl", listMap.get("unSignedUrl"));
                convertToFormDataObject(newListMap, "sortBy", listMap.get("sortBy"));
                convertToFormDataObject(newListMap, "pagination", listMap.get("pagination"));
                break;
            case "UPLOAD_FILE_FROM_BODY":
            case "UPLOAD_MULTIPLE_FILES_FROM_BODY":
                final Map createMap = (Map) formData.get("create");
                if (createMap == null) {
                    break;
                }
                final Map<String, Object> newCreateMap = new HashMap<>();
                f.put("create", newCreateMap);
                convertToFormDataObject(newCreateMap, "dataType", createMap.get("dataType"));
                convertToFormDataObject(newCreateMap, "expiry", createMap.get("expiry"));
                break;
            case "READ_FILE":
                final Map readMap = (Map) formData.get("read");
                if (readMap == null) {
                    break;
                }
                final Map<String, Object> newReadMap = new HashMap<>();
                f.put("read", newReadMap);
                convertToFormDataObject(newReadMap, "dataType", readMap.get("usingBase64Encoding"));
                break;
        }
    }

    private static void mapGoogleSheetsToNewFormData(ActionDTO action, Map<String, Object> f) {
        final Map<String, Object> formData = action.getActionConfiguration().getFormData();

        if (formData != null) {
            // This action has already been migrated
            throw new AppsmithException(AppsmithError.MIGRATION_ERROR);
        }

        final List<Property> pluginSpecifiedTemplates =
                action.getActionConfiguration().getPluginSpecifiedTemplates();

        if (pluginSpecifiedTemplates == null || pluginSpecifiedTemplates.isEmpty()) {
            // Nothing to do with this action, it is already incorrectly configured
            return;
        }

        final String oldCommand = (String) pluginSpecifiedTemplates.get(0).getValue();

        switch (oldCommand) {
            case "GET":
                convertToFormDataObject(f, "command", "FETCH_MANY");
                convertToFormDataObject(f, "entityType", "ROWS");
                break;
            case "APPEND":
                convertToFormDataObject(f, "command", "INSERT_ONE");
                convertToFormDataObject(f, "entityType", "ROWS");
                break;
            case "UPDATE":
                convertToFormDataObject(f, "command", "UPDATE_ONE");
                convertToFormDataObject(f, "entityType", "ROWS");
                break;
            case "DELETE_ROW":
                convertToFormDataObject(f, "command", "DELETE_ONE");
                convertToFormDataObject(f, "entityType", "ROWS");
                break;
            case "LIST":
                convertToFormDataObject(f, "command", "FETCH_MANY");
                convertToFormDataObject(f, "entityType", "SPREADSHEET");
                break;
            case "INFO":
                convertToFormDataObject(f, "command", "FETCH_DETAILS");
                convertToFormDataObject(f, "entityType", "SPREADSHEET");
                break;
            case "CREATE":
                convertToFormDataObject(f, "command", "INSERT_ONE");
                convertToFormDataObject(f, "entityType", "SPREADSHEET");
                break;
            case "DELETE":
                convertToFormDataObject(f, "command", "DELETE_ONE");
                break;
            case "BULK_APPEND":
                convertToFormDataObject(f, "command", "INSERT_MANY");
                convertToFormDataObject(f, "entityType", "ROWS");
                break;
            case "BULK_UPDATE":
                convertToFormDataObject(f, "command", "UPDATE_MANY");
                convertToFormDataObject(f, "entityType", "ROWS");
                break;
            default:
        }

        final int pluginSpecifiedTemplatesSize = pluginSpecifiedTemplates.size();

        switch (pluginSpecifiedTemplatesSize) {
            case 15:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(14))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(14).getValue())) {
                    convertToFormDataObject(
                            f,
                            "where",
                            updateWhereClauseFormat(
                                    pluginSpecifiedTemplates.get(14).getValue()));
                }
            case 14:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(13))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(13).getValue())) {
                    convertToFormDataObject(
                            f,
                            "smartSubstitution",
                            pluginSpecifiedTemplates.get(13).getValue());
                }
            case 13:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(12))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(12).getValue())
                        && "DELETE".equals(oldCommand)) {
                    convertToFormDataObject(
                            f, "entityType", pluginSpecifiedTemplates.get(12).getValue());
                }
            case 12:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(11))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(11).getValue())) {
                    convertToFormDataObject(
                            f, "rowIndex", pluginSpecifiedTemplates.get(11).getValue());
                }
            case 11:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(10))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(10).getValue())) {
                    if (List.of("BULK_APPEND", "BULK_UPDATE", "CREATE").contains(oldCommand)) {
                        convertToFormDataObject(
                                f,
                                "rowObjects",
                                pluginSpecifiedTemplates.get(10).getValue());
                    }
                }
            case 10:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(9))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(9).getValue())) {
                    if (List.of("APPEND", "UPDATE").contains(oldCommand)) {
                        convertToFormDataObject(
                                f, "rowObjects", pluginSpecifiedTemplates.get(9).getValue());
                    }
                }
            case 9:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(8))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(8).getValue())) {
                    if (!f.containsKey("pagination")) {
                        final HashMap<String, Object> map = new HashMap<>();
                        map.put("offset", pluginSpecifiedTemplates.get(8).getValue());
                        convertToFormDataObject(f, "pagination", map);
                    } else {
                        final Map<String, Object> pagination = (Map<String, Object>) f.get("pagination");
                        final Map<String, Object> data = (Map<String, Object>) pagination.get("data");
                        final Map<String, Object> componentData = (Map<String, Object>) pagination.get("componentData");
                        data.put("offset", pluginSpecifiedTemplates.get(8).getValue());
                        componentData.put(
                                "offset", pluginSpecifiedTemplates.get(8).getValue());
                    }
                }
            case 8:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(7))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(7).getValue())) {
                    // Sheet name will now have a dropdown component that is selected from a pre-populated list.
                    // Bindings would need to be placed in the JS mode
                    boolean hasBinding = false;
                    if (action.getDynamicBindingPathList() != null) {
                        hasBinding = action.getDynamicBindingPathList().stream().anyMatch(dynamicBindingPath -> {
                            return dynamicBindingPath.getKey().contains("pluginSpecifiedTemplates[7]");
                        });
                    }
                    convertToFormDataObject(
                            f, "sheetName", pluginSpecifiedTemplates.get(7).getValue(), hasBinding);
                }
            case 7:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(6))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(6).getValue())) {
                    if (!f.containsKey("pagination")) {
                        final HashMap<String, Object> map = new HashMap<>();
                        map.put("limit", pluginSpecifiedTemplates.get(6).getValue());
                        convertToFormDataObject(f, "pagination", map);
                    } else {
                        final Map<String, Object> pagination = (Map<String, Object>) f.get("pagination");
                        final Map<String, Object> data = (Map<String, Object>) pagination.get("data");
                        final Map<String, Object> componentData = (Map<String, Object>) pagination.get("componentData");
                        data.put("limit", pluginSpecifiedTemplates.get(6).getValue());
                        componentData.put(
                                "limit", pluginSpecifiedTemplates.get(6).getValue());
                    }
                }
            case 6:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(5))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(5).getValue())) {
                    convertToFormDataObject(
                            f, "queryFormat", pluginSpecifiedTemplates.get(5).getValue());
                }
            case 5:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(4))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(4).getValue())) {
                    convertToFormDataObject(
                            f,
                            "tableHeaderIndex",
                            pluginSpecifiedTemplates.get(4).getValue());
                }
            case 4:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(3))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(3).getValue())) {
                    convertToFormDataObject(
                            f,
                            "spreadsheetName",
                            pluginSpecifiedTemplates.get(3).getValue());
                }
            case 3:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(2))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(2).getValue())) {
                    convertToFormDataObject(
                            f, "range", pluginSpecifiedTemplates.get(2).getValue());
                }
            case 2:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(1))
                        && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(1).getValue())) {
                    // Sheet URL will now have a dropdown component that is selected from a pre-populated list.
                    // Bindings would need to be placed in the JS mode
                    boolean hasBinding = false;
                    if (action.getDynamicBindingPathList() != null) {
                        hasBinding = action.getDynamicBindingPathList().stream().anyMatch(dynamicBindingPath -> {
                            return dynamicBindingPath.getKey().contains("pluginSpecifiedTemplates[1]");
                        });
                    }
                    final String spreadsheetUrl =
                            (String) pluginSpecifiedTemplates.get(1).getValue();
                    final Matcher matcher = sheetRangePattern.matcher(spreadsheetUrl);

                    if (matcher.find()) {
                        final String newSpreadsheetUrl = matcher.replaceAll(
                                "https://docs.google.com/spreadsheets/d/" + matcher.group(1) + "/edit");
                        convertToFormDataObject(f, "sheetUrl", newSpreadsheetUrl, hasBinding);
                    } else {
                        convertToFormDataObject(f, "sheetUrl", spreadsheetUrl, hasBinding);
                    }
                }
        }
    }

    private static void convertToFormDataObject(Map<String, Object> formDataMap, String key, Object value) {
        convertToFormDataObject(formDataMap, key, value, false);
    }

    private static void convertToFormDataObject(
            Map<String, Object> formDataMap, String key, Object value, boolean hasBinding) {
        if (value == null) {
            return;
        }
        if (key != null) {
            final HashMap<String, Object> map = new HashMap<>();
            map.put("data", value);
            // If the element has a binding, it would not make sense to display it in the component mode.
            if (hasBinding) {
                map.put("jsonData", value);
                map.put("viewType", "json");
            } else {
                map.put("componentData", value);
                map.put("viewType", "component");
            }
            formDataMap.put(key, map);
        }
    }

    private static Map<String, Object> updateWhereClauseFormat(Object oldWhereClauseArray) {
        final Map<String, Object> newWhereClause = new HashMap<>();
        newWhereClause.put("condition", "AND");
        final List<Object> convertedConditionArray = new ArrayList<>();

        if (oldWhereClauseArray instanceof List) {
            ((ArrayList) oldWhereClauseArray).stream().forEach(oldWhereClauseCondition -> {
                if (oldWhereClauseCondition != null) {
                    Map<String, Object> newWhereClauseCondition = new HashMap<>();
                    final Map clauseCondition = (Map) oldWhereClauseCondition;
                    if (clauseCondition.isEmpty()) {
                        return;
                    }
                    if (clauseCondition.containsKey("path")) {
                        newWhereClauseCondition.put("key", clauseCondition.get("path"));
                    }
                    if (clauseCondition.containsKey("operator")) {
                        newWhereClauseCondition.put("condition", clauseCondition.get("operator"));
                    } else {
                        newWhereClauseCondition.put("condition", "LT");
                    }
                    if (clauseCondition.containsKey("value")) {
                        newWhereClauseCondition.put("value", clauseCondition.get("value"));
                    }
                    convertedConditionArray.add(newWhereClauseCondition);
                }
            });
        }

        if (!convertedConditionArray.isEmpty()) {
            newWhereClause.put("children", convertedConditionArray);
        }

        return newWhereClause;
    }

    /**
     * Method to port `dynamicBindingPathList` to UQI model.
     *
     * @param dynamicBindingPathList : old dynamicBindingPathList
     * @param objectMapper
     * @param action
     * @param migrationMap           : A mapping from `pluginSpecifiedTemplates` index to attribute path in UQI model. For
     *                               reference, here's an example:
     *        Map.ofEntries(
     *             Map.entry(0, List.of("command")),
     *             Map.entry(1, List.of("bucket")),
     *             Map.entry(2, List.of("list.signedUrl")),
     *             Map.entry(3, List.of("list.expiry")),
     *             Map.entry(4, List.of("list.prefix")),
     *             Map.entry(5, List.of("read.usingBase64Encoding")),
     *             Map.entry(6, List.of("create.dataType", "read.dataType")),
     *             Map.entry(7, List.of("create.expiry", "read.expiry", "delete.expiry")),
     *             Map.entry(8, List.of("list.unSignedUrl")));
     * @return : updated dynamicBindingPathList - ported to UQI model.
     */
    private static List<Property> getUpdatedDynamicBindingPathList(
            List<Property> dynamicBindingPathList,
            ObjectMapper objectMapper,
            NewAction action,
            Map<Integer, List<String>> migrationMap) {
        // Return if empty.
        if (org.springframework.util.CollectionUtils.isEmpty(dynamicBindingPathList)) {
            return dynamicBindingPathList;
        }

        List<Property> newDynamicBindingPathList = new ArrayList<>();
        for (Property path : dynamicBindingPathList) {
            String pathKey = path.getKey();
            if (pathKey.contains("pluginSpecifiedTemplates")) {

                // Pattern looks for pluginSpecifiedTemplates[12 and extracts the 12
                Pattern pattern = Pattern.compile("(?<=pluginSpecifiedTemplates\\[)([0-9]+)");
                Matcher matcher = pattern.matcher(pathKey);

                while (matcher.find()) {
                    int index = Integer.parseInt(matcher.group());
                    List<String> partialPaths = migrationMap.get(index);
                    for (String partialPath : partialPaths) {
                        Property dynamicBindingPath = new Property("formData." + partialPath, null);
                        newDynamicBindingPathList.add(dynamicBindingPath);
                    }
                }
            } else {
                // this dynamic binding is for body. Add as is
                newDynamicBindingPathList.add(path);
            }

            // We may have an invalid dynamic binding. Trim the same
            List<String> dynamicBindingPathNames = newDynamicBindingPathList.stream()
                    .map(property -> property.getKey())
                    .collect(Collectors.toList());

            Set<String> pathsToRemove =
                    getInvalidDynamicBindingPathsInAction(objectMapper, action, dynamicBindingPathNames);

            // We have found atleast 1 invalid dynamic binding path.
            if (!pathsToRemove.isEmpty()) {
                // First remove the invalid paths from the set of paths
                dynamicBindingPathNames.removeAll(pathsToRemove);

                // Transform the set of paths to Property as it is stored in the db.
                List<Property> updatedDynamicBindingPathList = dynamicBindingPathNames.stream()
                        .map(dynamicBindingPath -> {
                            Property property = new Property();
                            property.setKey(dynamicBindingPath);
                            return property;
                        })
                        .collect(Collectors.toList());

                // Reset the path list to only contain valid binding paths.
                newDynamicBindingPathList = updatedDynamicBindingPathList;
            }
        }

        return newDynamicBindingPathList;
    }

    private static Set<String> getInvalidDynamicBindingPathsInAction(
            ObjectMapper mapper, NewAction action, List<String> dynamicBindingPathNames) {
        Set<String> pathsToRemove = new HashSet<>();
        for (String path : dynamicBindingPathNames) {

            if (path != null) {

                String[] fields = path.split("[].\\[]");

                // Convert actionConfiguration into JSON Object and then walk till we reach the path specified.
                Map<String, Object> actionConfigurationMap =
                        mapper.convertValue(action.getUnpublishedAction().getActionConfiguration(), Map.class);
                Object parent = new JSONObject(actionConfigurationMap);
                Iterator<String> fieldsIterator = Arrays.stream(fields)
                        .filter(fieldToken -> !fieldToken.isBlank())
                        .iterator();
                Boolean isLeafNode = false;

                while (fieldsIterator.hasNext()) {
                    String nextKey = fieldsIterator.next();
                    if (parent instanceof JSONObject) {
                        parent = ((JSONObject) parent).get(nextKey);
                    } else if (parent instanceof Map) {
                        parent = ((Map<String, ?>) parent).get(nextKey);
                    } else if (parent instanceof List) {
                        if (Pattern.matches(Pattern.compile("[0-9]+").toString(), nextKey)) {
                            try {
                                parent = ((List) parent).get(Integer.parseInt(nextKey));
                            } catch (IndexOutOfBoundsException e) {
                                // The index being referred does not exist. Hence the path would not exist.
                                pathsToRemove.add(path);
                            }
                        } else {
                            // Parent is a list but does not match the pattern. Hence the path would not exist.
                            pathsToRemove.add(path);
                            break;
                        }
                    }

                    // After updating the parent, check for the types
                    if (parent == null) {
                        pathsToRemove.add(path);
                        break;
                    } else if (parent instanceof String) {
                        // If we get String value, then this is a leaf node
                        isLeafNode = true;
                    }
                }
                // Only extract mustache keys from leaf nodes
                if (parent != null && isLeafNode) {
                    Set<String> mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent).stream()
                            .map(token -> token.getValue())
                            .collect(Collectors.toSet());

                    // We found the path. But if the path does not have any mustache bindings, remove it from the path
                    // list
                    if (mustacheKeysFromFields.isEmpty()) {
                        pathsToRemove.add(path);
                    }
                }
            }
        }
        return pathsToRemove;
    }

    public static void migrateThemeSettingsForAnvil(ApplicationJson applicationJson) {
        if (applicationJson == null || applicationJson.getExportedApplication() == null) {
            return;
        }

        Application exportedApplication = applicationJson.getExportedApplication();
        ApplicationDetail applicationDetail = exportedApplication.getApplicationDetail();
        ApplicationDetail unpublishedApplicationDetail = exportedApplication.getUnpublishedApplicationDetail();

        if (applicationDetail == null) {
            applicationDetail = new ApplicationDetail();
            exportedApplication.setApplicationDetail(applicationDetail);
        }

        if (unpublishedApplicationDetail == null) {
            unpublishedApplicationDetail = new ApplicationDetail();
            exportedApplication.setUnpublishedApplicationDetail(unpublishedApplicationDetail);
        }

        Application.ThemeSetting themeSetting = applicationDetail.getThemeSetting();
        Application.ThemeSetting unpublishedThemeSetting = unpublishedApplicationDetail.getThemeSetting();
        if (themeSetting == null) {
            themeSetting = new Application.ThemeSetting();
        }

        if (unpublishedThemeSetting == null) {
            unpublishedThemeSetting = new Application.ThemeSetting();
        }

        applicationDetail.setThemeSetting(themeSetting);
        unpublishedApplicationDetail.setThemeSetting(unpublishedThemeSetting);
    }

    public static void setThemeSettings(Application.ThemeSetting themeSetting) {
        if (themeSetting.getAppMaxWidth() == null) {
            themeSetting.setAppMaxWidth(Application.ThemeSetting.AppMaxWidth.LARGE);
        }

        // since these are primitive values we don't have concept of null, hence putting it to the default of 1.
        if (themeSetting.getDensity() == 0) {
            themeSetting.setDensity(1);
        }

        if (themeSetting.getSizing() == 0) {
            themeSetting.setSizing(1);
        }
    }

    private static boolean conditionForDefaultRestDatasourceMigration(NewAction action) {
        Datasource actionDatasource = action.getUnpublishedAction().getDatasource();

        // condition to check if the action is default rest datasource.
        // it has no datasource id and name is equal to DEFAULT_REST_DATASOURCE
        boolean isActionDefaultRestDatasource = !org.springframework.util.StringUtils.hasText(actionDatasource.getId())
                && PluginConstants.DEFAULT_REST_DATASOURCE.equals(actionDatasource.getName());

        // condition to check if the action has missing url or has no config at all
        boolean isDatasourceConfigurationOrUrlMissing = actionDatasource.getDatasourceConfiguration() == null
                || !org.springframework.util.StringUtils.hasText(
                        actionDatasource.getDatasourceConfiguration().getUrl());

        return isActionDefaultRestDatasource && isDatasourceConfigurationOrUrlMissing;
    }

    /**
     * Adds datasource configuration and relevant url to the embedded datasource actions.
     * @param applicationJson: ApplicationJson for which the migration has to be performed
     * @param defaultDatasourceActionMap: gitSyncId to actions with default rest datasource map
     */
    public static void migrateApplicationJsonToVersionTen(
            ApplicationJson applicationJson, Map<String, NewAction> defaultDatasourceActionMap) {
        List<NewAction> actionList = applicationJson.getActionList();
        if (CollectionUtils.isNullOrEmpty(actionList)) {
            return;
        }

        for (NewAction action : actionList) {
            if (action.getUnpublishedAction() == null
                    || action.getUnpublishedAction().getDatasource() == null) {
                continue;
            }

            Datasource actionDatasource = action.getUnpublishedAction().getDatasource();
            if (conditionForDefaultRestDatasourceMigration(action)) {
                // Idea is to add datasourceConfiguration to existing DEFAULT_REST_DATASOURCE apis,
                // for which the datasource configuration is missing
                // the url would be set to empty string as right url is not present over here.
                setDatasourceConfigDetailsInDefaultRestDatasourceForActions(action, defaultDatasourceActionMap);
            }
        }
    }

    /**
     * Finds if the applicationJson has any default rest datasource which has a null datasource configuration
     * or an unset url.
     * @param applicationJson : Application Json for which requirement is to be checked.
     * @return true if the application has a rest api which doesn't have a valid datasource configuration.
     */
    public static Boolean doesRestApiRequireMigration(ApplicationJson applicationJson) {
        List<NewAction> actionList = applicationJson.getActionList();
        if (CollectionUtils.isNullOrEmpty(actionList)) {
            return Boolean.FALSE;
        }

        for (NewAction action : actionList) {
            if (action.getUnpublishedAction() == null
                    || action.getUnpublishedAction().getDatasource() == null) {
                continue;
            }

            Datasource actionDatasource = action.getUnpublishedAction().getDatasource();
            if (conditionForDefaultRestDatasourceMigration(action)) {
                return Boolean.TRUE;
            }
        }

        return Boolean.FALSE;
    }

    /**
     * Adds the relevant url in the default rest datasource for the given action from an action in the db
     * otherwise sets the url to empty
     * it's established that action doesn't have the datasource.
     * @param action : default rest datasource actions which doesn't have valid datasource configuration.
     * @param defaultDatasourceActionMap : gitSyncId to actions with default rest datasource map
     */
    public static void setDatasourceConfigDetailsInDefaultRestDatasourceForActions(
            NewAction action, Map<String, NewAction> defaultDatasourceActionMap) {

        ActionDTO actionDTO = action.getUnpublishedAction();
        Datasource actionDatasource = actionDTO.getDatasource();
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        if (defaultDatasourceActionMap.containsKey(action.getGitSyncId())) {
            NewAction actionFromMap = defaultDatasourceActionMap.get(action.getGitSyncId());
            DatasourceConfiguration datasourceConfigurationFromDBAction =
                    actionFromMap.getUnpublishedAction().getDatasource().getDatasourceConfiguration();

            if (datasourceConfigurationFromDBAction != null) {
                datasourceConfiguration.setUrl(datasourceConfigurationFromDBAction.getUrl());
            }
        }

        if (!org.springframework.util.StringUtils.hasText(datasourceConfiguration.getUrl())) {
            datasourceConfiguration.setUrl("");
        }

        actionDatasource.setDatasourceConfiguration(datasourceConfiguration);
    }
}
