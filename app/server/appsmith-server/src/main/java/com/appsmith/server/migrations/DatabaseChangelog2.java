package com.appsmith.server.migrations;

import com.appsmith.external.models.Property;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.dtos.ActionDTO;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.github.cloudyrock.mongock.driver.mongodb.springdata.v3.decorator.impl.MongockTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeLog(order = "002")
public class DatabaseChangelog2 {

    @ChangeSet(order = "001", id = "fix-plugin-title-casing", author = "")
    public void fixPluginTitleCasing(MongockTemplate mongockTemplate) {
        mongockTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("mysql-plugin")),
                Update.update(fieldName(QPlugin.plugin.name), "MySQL"),
                Plugin.class
        );

        mongockTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("mssql-plugin")),
                Update.update(fieldName(QPlugin.plugin.name), "Microsoft SQL Server"),
                Plugin.class
        );

        mongockTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("elasticsearch-plugin")),
                Update.update(fieldName(QPlugin.plugin.name), "Elasticsearch"),
                Plugin.class
        );
    }

    @ChangeSet(order = "002", id = "deprecate-archivedAt-in-action", author = "")
    public void deprecateArchivedAtForNewAction(MongockTemplate mongockTemplate) {
        // Update actions
        final Query actionQuery = query(where(fieldName(QNewAction.newAction.applicationId)).exists(true))
                .addCriteria(where(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.archivedAt)).exists(true));

        actionQuery.fields()
                .include(fieldName(QNewAction.newAction.id))
                .include(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.archivedAt));

        List<NewAction> actions = mongockTemplate.find(actionQuery, NewAction.class);

        for (NewAction action : actions) {

            final Update update = new Update();

            ActionDTO unpublishedAction = action.getUnpublishedAction();
            if (unpublishedAction != null) {
                final Instant archivedAt = unpublishedAction.getArchivedAt();
                update.set(
                        fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.deletedAt),
                        archivedAt
                );
                update.unset(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.archivedAt));
            }
            mongockTemplate.updateFirst(
                    query(where(fieldName(QNewAction.newAction.id)).is(action.getId())),
                    update,
                    NewAction.class
            );
        }
    }

    /**
     * To be able to support form and raw mode in the UQI compatible plugins,
     * we need to be migrating all existing data to the data and formData path.
     * Anything that was already raw would not be within formData,
     * so we can blindly switch the contents of formData into inner objects
     * Example: formData.limit will transform to formData.limit.data and formData.limit.formData
     *
     * @param mongockTemplate
     */
    @ChangeSet(order = "003", id = "update-form-data-for-uqi-mode", author = "")
    public void updateActionFormDataPath(MongockTemplate mongockTemplate) {

        // Get all plugin references to Mongo, S3 and Firestore actions
        List<Plugin> uqiPlugins = mongockTemplate.find(
                query(where("packageName").in("mongo-plugin", "amazons3-plugin", "firestore-plugin")),
                Plugin.class
        );

        final Map<String, String> pluginMap = uqiPlugins.stream()
                .collect(Collectors.toMap(Plugin::getId, Plugin::getPackageName));

        final Set<String> pluginIds = pluginMap.keySet();

        // Find all relevant actions
        final Query actionQuery = query(
                where(fieldName(QNewAction.newAction.pluginId)).in(pluginIds)
                        .and(fieldName(QNewAction.newAction.deleted)).ne(true)); // setting `deleted` != `true`
        actionQuery.fields()
                .include(fieldName(QNewAction.newAction.id));

        List<NewAction> uqiActions = mongockTemplate.find(
                actionQuery,
                NewAction.class
        );

        // Retrieve the formData path for all actions
        for (NewAction uqiActionWithId : uqiActions) {

            // Fetch one action at a time to avoid OOM.
            final NewAction uqiAction = mongockTemplate.findOne(
                    query(where(fieldName(QNewAction.newAction.id)).is(uqiActionWithId.getId())),
                    NewAction.class
            );

            assert uqiAction != null;
            ActionDTO unpublishedAction = uqiAction.getUnpublishedAction();

            /* No migrations required if action configuration does not exist. */
            if (unpublishedAction == null || unpublishedAction.getActionConfiguration() == null) {
                continue;
            }

            if (pluginMap.get(uqiAction.getPluginId()).equals("firestore-plugin")) {
                migrateFirestoreActionsFormData(uqiAction);
            } else if (pluginMap.get(uqiAction.getPluginId()).equals("amazons3-plugin")) {
                migrateAmazonS3ActionsFormData(uqiAction);
            } else {
                migrateMongoActionsFormData(uqiAction);
            }

            mongockTemplate.save(uqiAction);
        }
    }

    public static void migrateFirestoreActionsFormData(NewAction uqiAction) {
        ActionDTO unpublishedAction = uqiAction.getUnpublishedAction();
        /**
         * Migrate unpublished action configuration data.
         */
        final Map<String, Object> unpublishedFormData = unpublishedAction.getActionConfiguration().getFormData();

        if (unpublishedFormData != null) {
            unpublishedFormData
                    .keySet()
                    .stream()
                    .forEach(k -> {
                        final Object oldValue = unpublishedFormData.get(k);
                        unpublishedFormData.put(k, Map.of(
                                "data", oldValue,
                                "componentData", oldValue,
                                "viewType", "component"
                        ));
                    });

        }

        final String unpublishedBody = unpublishedAction.getActionConfiguration().getBody();
        if (StringUtils.hasLength(unpublishedBody)) {
            convertToFormDataObject(unpublishedFormData, "body", unpublishedBody);
            unpublishedAction.getActionConfiguration().setBody(null);
        }

        final String unpublishedPath = unpublishedAction.getActionConfiguration().getPath();
        if (StringUtils.hasLength(unpublishedPath)) {
            convertToFormDataObject(unpublishedFormData, "path", unpublishedPath);
            unpublishedAction.getActionConfiguration().setPath(null);
        }

        final String unpublishedNext = unpublishedAction.getActionConfiguration().getNext();
        if (StringUtils.hasLength(unpublishedNext)) {
            convertToFormDataObject(unpublishedFormData, "next", unpublishedNext);
            unpublishedAction.getActionConfiguration().setNext(null);
        }

        final String unpublishedPrev = unpublishedAction.getActionConfiguration().getPrev();
        if (StringUtils.hasLength(unpublishedPrev)) {
            convertToFormDataObject(unpublishedFormData, "prev", unpublishedPrev);
            unpublishedAction.getActionConfiguration().setPrev(null);
        }

        /**
         * Migrate published action configuration data.
         */
        ActionDTO publishedAction = uqiAction.getPublishedAction();
        if (publishedAction != null && publishedAction.getActionConfiguration() != null &&
                publishedAction.getActionConfiguration().getFormData() != null) {
            final Map<String, Object> publishedFormData = publishedAction.getActionConfiguration().getFormData();

            publishedFormData
                    .keySet()
                    .stream()
                    .forEach(k -> {
                        final Object oldValue = publishedFormData.get(k);
                        publishedFormData.put(k, Map.of(
                                "data", oldValue,
                                "componentData", oldValue,
                                "viewType", "component"
                        ));
                    });

            final String publishedBody = publishedAction.getActionConfiguration().getBody();
            if (StringUtils.hasLength(publishedBody)) {
                convertToFormDataObject(publishedFormData, "body", publishedBody);
                publishedAction.getActionConfiguration().setBody(null);
            }

            final String publishedPath = publishedAction.getActionConfiguration().getPath();
            if (StringUtils.hasLength(publishedPath)) {
                convertToFormDataObject(publishedFormData, "path", publishedPath);
                publishedAction.getActionConfiguration().setPath(null);
            }

            final String publishedNext = publishedAction.getActionConfiguration().getNext();
            if (StringUtils.hasLength(publishedNext)) {
                convertToFormDataObject(publishedFormData, "next", publishedNext);
                publishedAction.getActionConfiguration().setNext(null);
            }

            final String publishedPrev = publishedAction.getActionConfiguration().getPrev();
            if (StringUtils.hasLength(publishedPrev)) {
                convertToFormDataObject(publishedFormData, "prev", publishedPrev);
                publishedAction.getActionConfiguration().setPrev(null);
            }
        }

        /**
         * Migrate the dynamic binding path list for unpublished action.
         * Please note that there is no requirement to migrate the dynamic binding path list for published actions
         * since the `on page load` actions do not get computed on published actions data. They are only computed
         * on unpublished actions data and copied over for the view mode.
         */
        List<Property> dynamicBindingPathList = unpublishedAction.getDynamicBindingPathList();
        if (dynamicBindingPathList != null && !dynamicBindingPathList.isEmpty()) {
            dynamicBindingPathList
                    .stream()
                    .forEach(dynamicBindingPath -> {
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

    private static void convertToFormDataObject(Map<String, Object> formDataMap, String key, Object value) {
        if (value == null) {
            return;
        }
        formDataMap.put(key,
                Map.of(
                        "data", value,
                        "componentData", value,
                        "viewType", "component"
                ));
    }

    private static void mapS3ToNewFormData(ActionDTO action, Map<String, Object> f) {
        final Map<String, Object> formData = action.getActionConfiguration().getFormData();

        if (formData == null) {
            return;
        }

        final String body = action.getActionConfiguration().getBody();
        if (StringUtils.hasLength(body)) {
            convertToFormDataObject(f, "body", body);
            action.getActionConfiguration().setBody(null);
        }

        final String path = action.getActionConfiguration().getPath();
        if (StringUtils.hasLength(path)) {
            convertToFormDataObject(f, "path", path);
            action.getActionConfiguration().setPath(null);
        }

        final String command = (String) formData.get("command");
        if (command == null) {
            return;
        }
        convertToFormDataObject(f, "command", command);
        convertToFormDataObject(f, "bucket", formData.get("bucket"));
        convertToFormDataObject(f, "smartSubstitution", formData.get("smartSubstitution"));
        switch (command) {
            // No case for delete single and multiple since they only had bucket that needed migration
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
                final Map<String,Object> newCreateMap = new HashMap<>();
                f.put("create", newCreateMap);
                convertToFormDataObject(newCreateMap, "dataType", createMap.get("dataType"));
                convertToFormDataObject(newCreateMap, "expiry", createMap.get("expiry"));
                break;
            case "READ_FILE":
                final Map readMap = (Map) formData.get("read");
                if (readMap == null) {
                    break;
                }
                final Map<String,Object> newReadMap = new HashMap<>();
                f.put("read", newReadMap);
                convertToFormDataObject(newReadMap, "dataType", readMap.get("usingBase64Encoding"));
                break;
        }
    }

    public static void migrateAmazonS3ActionsFormData(NewAction uqiAction) {
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
         * Please note that there is no requirement to migrate the dynamic binding path list for published actions
         * since the `on page load` actions do not get computed on published actions data. They are only computed
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
            dynamicBindingPathList
                    .stream()
                    .forEach(dynamicBindingPath -> {
                        final String currentBinding = dynamicBindingPath.getKey();
                        final Optional<String> matchingBinding = dynamicBindingMapper.keySet().stream().filter(currentBinding::startsWith).findFirst();
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

        final String body = action.getActionConfiguration().getBody();
        if (StringUtils.hasLength(body)) {
            convertToFormDataObject(f, "body", body);
            action.getActionConfiguration().setBody(null);
        }

        final String command = (String) formData.get("command");
        if (command == null) {
            return;
        }
        convertToFormDataObject(f, "command", command);
        convertToFormDataObject(f, "collection", formData.get("collection"));
        convertToFormDataObject(f, "smartSubstitution", formData.get("smartSubstitution"));
        switch (command) {
            case "AGGREGATE":
                final Map aggregateMap = (Map) formData.get("aggregate");
                if (aggregateMap == null) {
                    break;
                }
                final Map<String,Object> newAggregateMap = new HashMap<>();
                f.put("aggregate", newAggregateMap);
                convertToFormDataObject(newAggregateMap, "arrayPipelines", aggregateMap.get("arrayPipelines"));
                convertToFormDataObject(newAggregateMap, "limit", aggregateMap.get("limit"));
                break;
            case "COUNT":
                final Map countMap = (Map) formData.get("count");
                if (countMap == null) {
                    break;
                }
                final Map<String,Object> newCountMap = new HashMap<>();
                f.put("count", newCountMap);
                convertToFormDataObject(newCountMap, "query", countMap.get("query"));
                break;
            case "DELETE":
                final Map deleteMap = (Map) formData.get("delete");
                if (deleteMap == null) {
                    break;
                }
                final Map<String,Object> newDeleteMap = new HashMap<>();
                f.put("delete", newDeleteMap);
                convertToFormDataObject(newDeleteMap, "query", deleteMap.get("query"));
                convertToFormDataObject(newDeleteMap, "limit", deleteMap.get("limit"));
                break;
            case "DISTINCT":
                final Map distinctMap = (Map) formData.get("distinct");
                if (distinctMap == null) {
                    break;
                }
                final Map<String,Object> newDistinctMap = new HashMap<>();
                f.put("distinct", newDistinctMap);
                convertToFormDataObject(newDistinctMap, "query", distinctMap.get("query"));
                convertToFormDataObject(newDistinctMap, "key", distinctMap.get("key"));
                break;
            case "FIND":
                final Map findMap = (Map) formData.get("find");
                if (findMap == null) {
                    break;
                }
                final Map<String,Object> newFindMap = new HashMap<>();
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
                final Map<String,Object> newInsertMap = new HashMap<>();
                f.put("insert", newInsertMap);
                convertToFormDataObject(newInsertMap, "documents", insertMap.get("documents"));
                break;
            case "UPDATE":
                final Map updateMap = (Map) formData.get("updateMany");
                if (updateMap == null) {
                    break;
                }
                final Map<String,Object> newUpdateManyMap = new HashMap<>();
                f.put("updateMany", newUpdateManyMap);
                convertToFormDataObject(newUpdateManyMap, "query", updateMap.get("query"));
                convertToFormDataObject(newUpdateManyMap, "update", updateMap.get("update"));
                convertToFormDataObject(newUpdateManyMap, "limit", updateMap.get("limit"));
                break;
        }
    }

    public static void migrateMongoActionsFormData(NewAction uqiAction) {
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
         * Please note that there is no requirement to migrate the dynamic binding path list for published actions
         * since the `on page load` actions do not get computed on published actions data. They are only computed
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
            dynamicBindingPathList
                    .stream()
                    .forEach(dynamicBindingPath -> {
                        final String currentBinding = dynamicBindingPath.getKey();
                        final Optional<String> matchingBinding = dynamicBindingMapper.keySet().stream().filter(currentBinding::startsWith).findFirst();
                        if (matchingBinding.isPresent()) {
                            final String newBindingPrefix = dynamicBindingMapper.get(matchingBinding.get());
                            dynamicBindingPath.setKey(currentBinding.replace(matchingBinding.get(), newBindingPrefix));
                        }
                    });
        }
    }

}

