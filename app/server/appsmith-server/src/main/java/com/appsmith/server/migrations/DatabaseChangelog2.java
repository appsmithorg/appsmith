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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    /**
     * To be able to support form and raw mode in the UQI compatible plugins,
     * we need to be migrating all existing data to the data and formData path.
     * Anything that was already raw would not be within formData,
     * so we can blindly switch the contents of formData into inner objects
     * Example: formData.limit will transform to formData.limit.data and formData.limit.formData
     *
     * @param mongockTemplate
     */
    @ChangeSet(order = "112", id = "update-form-data-for-uqi-mode", author = "")
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

    private void migrateFirestoreActionsFormData(NewAction uqiAction) {
        ActionDTO unpublishedAction = uqiAction.getUnpublishedAction();
        /**
         * Migrate unpublished action configuration data.
         */
        final Map<String, Object> unpublishedFormData = unpublishedAction.getActionConfiguration().getFormData();

        unpublishedFormData
                .keySet()
                .stream()
                .forEach(k -> {
                    final Object oldValue = unpublishedFormData.get(k);
                    unpublishedFormData.put(k, Map.of(
                            "data", oldValue,
                            "componentData", oldValue,
                            "viewType", "form"
                    ));
                });

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
                                "viewType", "form"
                        ));
                    });
        }

        /**
         * Migrate the dynamic binding path list for unpublished action.
         * Please note that there is no requirement to migrate the dynamic binding path list for published actions
         * since the `on page load` actions do not get computed on published actions data. They are only computed
         * on unpublished actions data and copied over for the view mode.
         */
        List<Property> dynamicBindingPathList = unpublishedAction.getDynamicBindingPathList();
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
                    }
                });

    }

    private void convertToFormDataObject(Map<String, Object> formDataMap, String key, Object value) {
        if (value == null) {
            return;
        }
        formDataMap.put(key,
                Map.of(
                        "data", value,
                        "componentData", value,
                        "viewType", "form"
                ));
    }

    private void mapS3ToNewFormData(ActionDTO action, Map<String, Object> newUnpublishedFormDataMap) {
        final Map<String, Object> unpublishedFormData = action.getActionConfiguration().getFormData();
        final String command = (String) unpublishedFormData.get("command");
        if (command == null) {
            return;
        }
        convertToFormDataObject(newUnpublishedFormDataMap, "command", command);
        convertToFormDataObject(newUnpublishedFormDataMap, "bucket", unpublishedFormData.get("bucket"));
        convertToFormDataObject(newUnpublishedFormDataMap, "smartSubstitution", unpublishedFormData.get("smartSubstitution"));
        switch (command) {
            // No case for delete single and multiple since they only had bucket that needed migration
            case "LIST":
                final Map listMap = (Map) unpublishedFormData.get("list");
                if (listMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "prefix", listMap.get("prefix"));
                convertToFormDataObject(newUnpublishedFormDataMap, "where", listMap.get("where"));
                convertToFormDataObject(newUnpublishedFormDataMap, "signedUrl", listMap.get("signedUrl"));
                convertToFormDataObject(newUnpublishedFormDataMap, "expiry", listMap.get("expiry"));
                convertToFormDataObject(newUnpublishedFormDataMap, "unSignedUrl", listMap.get("unSignedUrl"));
                convertToFormDataObject(newUnpublishedFormDataMap, "sortBy", listMap.get("sortBy"));
                convertToFormDataObject(newUnpublishedFormDataMap, "pagination", listMap.get("pagination"));
                break;
            case "UPLOAD_FILE_FROM_BODY":
            case "UPLOAD_MULTIPLE_FILES_FROM_BODY":
                final Map createMap = (Map) unpublishedFormData.get("create");
                if (createMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "dataType", createMap.get("dataType"));
                convertToFormDataObject(newUnpublishedFormDataMap, "expiry", createMap.get("expiry"));
                break;
            case "READ_FILE":
                final Map readMap = (Map) unpublishedFormData.get("read");
                if (readMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "dataType", readMap.get("usingBase64Encoding"));
                break;
        }
    }

    private void migrateAmazonS3ActionsFormData(NewAction uqiAction) {
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
        Map<String, String> dynamicBindingMapper = new HashMap<>();
        dynamicBindingMapper.put("formData.command", "formData.command.data");
        dynamicBindingMapper.put("formData.bucket", "formData.bucket.data");
        dynamicBindingMapper.put("formData.create.dataType", "formData.dataType.data");
        dynamicBindingMapper.put("formData.create.expiry", "formData.expiry.data");
        dynamicBindingMapper.put("formData.delete.expiry", "formData.expiry.data");
        dynamicBindingMapper.put("formData.list.prefix", "formData.prefix.data");
        dynamicBindingMapper.put("formData.list.where", "formData.where.data");
        dynamicBindingMapper.put("formData.list.signedUrl", "formData.signedUrl.data");
        dynamicBindingMapper.put("formData.list.expiry", "formData.expiry.data");
        dynamicBindingMapper.put("formData.list.unSignedUrl", "formData.unSignedUrl.data");
        dynamicBindingMapper.put("formData.list.sortBy", "formData.sortBy.data");
        dynamicBindingMapper.put("formData.list.pagination", "formData.pagination.data");
        dynamicBindingMapper.put("formData.read.dataType", "formData.dataType.data");
        dynamicBindingMapper.put("formData.read.expiry", "formData.expiry.data");
        dynamicBindingMapper.put("formData.smartSubstitution", "formData.smartSubstitution.data");
        dynamicBindingPathList
                .stream()
                .forEach(dynamicBindingPath -> {
                    if (dynamicBindingMapper.containsKey(dynamicBindingPath.getKey())) {
                        dynamicBindingPath.setKey(dynamicBindingMapper.get(dynamicBindingPath.getKey()));
                    }
                });

    }

    private void mapMongoToNewFormData(ActionDTO action, Map<String, Object> f) {
        final Map<String, Object> formData = action.getActionConfiguration().getFormData();
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
                convertToFormDataObject(f, "arrayPipelines", aggregateMap.get("arrayPipelines"));
                convertToFormDataObject(f, "limit", aggregateMap.get("limit"));
                break;
            case "COUNT":
                final Map countMap = (Map) formData.get("count");
                if (countMap == null) {
                    break;
                }
                convertToFormDataObject(f, "query", countMap.get("query"));
                break;
            case "DELETE":
                final Map deleteMap = (Map) formData.get("delete");
                if (deleteMap == null) {
                    break;
                }
                convertToFormDataObject(f, "query", deleteMap.get("query"));
                convertToFormDataObject(f, "limit", deleteMap.get("limit"));
                break;
            case "DISTINCT":
                final Map distinctMap = (Map) formData.get("distinct");
                if (distinctMap == null) {
                    break;
                }
                convertToFormDataObject(f, "query", distinctMap.get("query"));
                convertToFormDataObject(f, "key", distinctMap.get("key"));
                break;
            case "FIND":
                final Map findMap = (Map) formData.get("find");
                if (findMap == null) {
                    break;
                }
                convertToFormDataObject(f, "query", findMap.get("query"));
                convertToFormDataObject(f, "sort", findMap.get("sort"));
                convertToFormDataObject(f, "projection", findMap.get("projection"));
                convertToFormDataObject(f, "limit", findMap.get("limit"));
                convertToFormDataObject(f, "skip", findMap.get("skip"));
                break;
            case "INSERT":
                final Map insertMap = (Map) formData.get("insert");
                if (insertMap == null) {
                    break;
                }
                convertToFormDataObject(f, "documents", insertMap.get("documents"));
                break;
            case "UPDATE":
                final Map updateMap = (Map) formData.get("updateMany");
                if (updateMap == null) {
                    break;
                }
                convertToFormDataObject(f, "query", updateMap.get("query"));
                convertToFormDataObject(f, "update", updateMap.get("update"));
                convertToFormDataObject(f, "limit", updateMap.get("limit"));
                break;
        }
    }

    private void migrateMongoActionsFormData(NewAction uqiAction) {
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
        Map<String, String> dynamicBindingMapper = new HashMap<>();
        dynamicBindingMapper.put("formData.command", "formData.command.data");
        dynamicBindingMapper.put("formData.collection", "formData.collection.data");
        dynamicBindingMapper.put("formData.aggregate.arrayPipelines", "formData.arrayPipelines.data");
        dynamicBindingMapper.put("formData.aggregate.limit", "formData.limit.data");
        dynamicBindingMapper.put("formData.count.query", "formData.query.data");
        dynamicBindingMapper.put("formData.delete.query", "formData.query.data");
        dynamicBindingMapper.put("formData.delete.limit", "formData.limit.data");
        dynamicBindingMapper.put("formData.distinct.query", "formData.query.data");
        dynamicBindingMapper.put("formData.distinct.key", "formData.key.data");
        dynamicBindingMapper.put("formData.find.query", "formData.query.data");
        dynamicBindingMapper.put("formData.find.sort", "formData.sort.data");
        dynamicBindingMapper.put("formData.find.projection", "formData.projection.data");
        dynamicBindingMapper.put("formData.find.limit", "formData.limit.data");
        dynamicBindingMapper.put("formData.find.skip", "formData.skip.data");
        dynamicBindingMapper.put("formData.insert.documents", "formData.documents.data");
        dynamicBindingMapper.put("formData.updateMany.query", "formData.query.data");
        dynamicBindingMapper.put("formData.updateMany.update", "formData.update.data");
        dynamicBindingMapper.put("formData.updateMany.limit", "formData.limit.data");
        dynamicBindingMapper.put("formData.smartSubstitution", "formData.smartSubstitution.data");
        dynamicBindingPathList
                .stream()
                .forEach(dynamicBindingPath -> {
                    if (dynamicBindingMapper.containsKey(dynamicBindingPath.getKey())) {
                        dynamicBindingPath.setKey(dynamicBindingMapper.get(dynamicBindingPath.getKey()));
                    }
                });

    }


}

