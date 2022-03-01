package com.appsmith.server.migrations;

import com.appsmith.external.models.Property;
import com.appsmith.server.domains.ApplicationJson;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JsonSchemaMigration {
    private static boolean checkCompatibility(ApplicationJson applicationJson) {
        return (applicationJson.getClientSchemaVersion() <= JsonSchemaVersions.clientVersion)
                && (applicationJson.getServerSchemaVersion() <= JsonSchemaVersions.serverVersion);
    }

    public static ApplicationJson migrateApplicationToLatestSchema(ApplicationJson applicationJson) {
        // Check if the schema versions are available and set to initial version if not present
        Integer serverSchemaVersion = applicationJson.getServerSchemaVersion() == null ? 0 : applicationJson.getServerSchemaVersion();
        Integer clientSchemaVersion = applicationJson.getClientSchemaVersion() == null ? 0 : applicationJson.getClientSchemaVersion();

        applicationJson.setClientSchemaVersion(clientSchemaVersion);
        applicationJson.setServerSchemaVersion(serverSchemaVersion);
        if (!checkCompatibility(applicationJson)) {
            throw new AppsmithException(AppsmithError.INCOMPATIBLE_IMPORTED_JSON);
        }
        migrateServerSchema(applicationJson);
        migrateClientSchema(applicationJson);
        return applicationJson;
    }

    private static ApplicationJson migrateServerSchema(ApplicationJson applicationJson) {
        if (JsonSchemaVersions.serverVersion.equals(applicationJson.getServerSchemaVersion())) {
            // No need to run server side migration
            return applicationJson;
        }
        // Run migration linearly
        switch (applicationJson.getServerSchemaVersion()) {
            case 0:

            case 1:
                migrateActionFormDataToObject(applicationJson);
            default:
                // Unable to detect the serverSchema
        }
        return applicationJson;
    }

    private static ApplicationJson migrateClientSchema(ApplicationJson applicationJson) {
        if (JsonSchemaVersions.clientVersion.equals(applicationJson.getClientSchemaVersion())) {
            // No need to run client side migration
            return applicationJson;
        }
        // Today server is not responsible to run the client side DSL migration but this can be useful if we start
        // supporting this on server side
        return applicationJson;
    }

    private static void migrateActionFormDataToObject(ApplicationJson applicationJson) {
        final List<NewAction> actionList = applicationJson.getActionList();

        actionList.parallelStream()
                .forEach(newAction -> {
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

    private static void migrateFirestoreActionsFormData(NewAction uqiAction) {
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

    private static void convertToFormDataObject(Map<String, Object> formDataMap, String key, Object value) {
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

    private static void mapS3ToNewFormData(ActionDTO action, Map<String, Object> newUnpublishedFormDataMap) {
        final Map<String, Object> formData = action.getActionConfiguration().getFormData();
        final String command = (String) formData.get("command");
        if (command == null) {
            return;
        }
        convertToFormDataObject(newUnpublishedFormDataMap, "command", command);
        convertToFormDataObject(newUnpublishedFormDataMap, "bucket", formData.get("bucket"));
        convertToFormDataObject(newUnpublishedFormDataMap, "smartSubstitution", formData.get("smartSubstitution"));
        switch (command) {
            case "LIST":
                final Map listMap = (Map) formData.get("list");
                if (listMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "prefix", listMap.get("prefix"));
                convertToFormDataObject(newUnpublishedFormDataMap, "where", listMap.get("where"));
                convertToFormDataObject(newUnpublishedFormDataMap, "signedUrl", listMap.get("signedUrl"));
                convertToFormDataObject(newUnpublishedFormDataMap, "expiry", listMap.get("expiry"));
                convertToFormDataObject(newUnpublishedFormDataMap, "unSignedUrl", listMap.get("unSignedUrl"));
                break;
            case "UPLOAD_FILE_FROM_BODY":
            case "UPLOAD_MULTIPLE_FILES_FROM_BODY":
                final Map createMap = (Map) formData.get("create");
                if (createMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "dataType", createMap.get("dataType"));
                convertToFormDataObject(newUnpublishedFormDataMap, "expiry", createMap.get("expiry"));
                break;
            case "DELETE_FILE":
                final Map deleteMap = (Map) formData.get("delete");
                if (deleteMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "expiry", deleteMap.get("expiry"));
                break;
            case "READ_FILE":
                final Map readMap = (Map) formData.get("read");
                if (readMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "dataType", readMap.get("usingBase64Encoding"));
                convertToFormDataObject(newUnpublishedFormDataMap, "expiry", readMap.get("expiry"));
                break;
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

    private static void mapMongoToNewFormData(ActionDTO action, Map<String, Object> newUnpublishedFormDataMap) {
        final Map<String, Object> formData = action.getActionConfiguration().getFormData();
        final String command = (String) formData.get("command");
        if (command == null) {
            return;
        }
        convertToFormDataObject(newUnpublishedFormDataMap, "command", command);
        convertToFormDataObject(newUnpublishedFormDataMap, "collection", formData.get("collection"));
        convertToFormDataObject(newUnpublishedFormDataMap, "smartSubstitution", formData.get("smartSubstitution"));
        switch (command) {
            case "AGGREGATE":
                final Map aggregateMap = (Map) formData.get("aggregate");
                if (aggregateMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "arrayPipelines", aggregateMap.get("arrayPipelines"));
                convertToFormDataObject(newUnpublishedFormDataMap, "limit", aggregateMap.get("limit"));
                break;
            case "COUNT":
                final Map countMap = (Map) formData.get("count");
                if (countMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "query", countMap.get("query"));
                break;
            case "DELETE":
                final Map deleteMap = (Map) formData.get("delete");
                if (deleteMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "query", deleteMap.get("query"));
                convertToFormDataObject(newUnpublishedFormDataMap, "limit", deleteMap.get("limit"));
                break;
            case "DISTINCT":
                final Map distinctMap = (Map) formData.get("distinct");
                if (distinctMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "query", distinctMap.get("query"));
                convertToFormDataObject(newUnpublishedFormDataMap, "key", distinctMap.get("key"));
                break;
            case "FIND":
                final Map findMap = (Map) formData.get("find");
                if (findMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "query", findMap.get("query"));
                convertToFormDataObject(newUnpublishedFormDataMap, "sort", findMap.get("sort"));
                convertToFormDataObject(newUnpublishedFormDataMap, "projection", findMap.get("projection"));
                convertToFormDataObject(newUnpublishedFormDataMap, "limit", findMap.get("limit"));
                convertToFormDataObject(newUnpublishedFormDataMap, "skip", findMap.get("skip"));
                break;
            case "INSERT":
                final Map insertMap = (Map) formData.get("insert");
                if (insertMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "documents", insertMap.get("documents"));
                break;
            case "UPDATE":
                final Map updateMap = (Map) formData.get("updateMany");
                if (updateMap == null) {
                    break;
                }
                convertToFormDataObject(newUnpublishedFormDataMap, "query", updateMap.get("query"));
                convertToFormDataObject(newUnpublishedFormDataMap, "update", updateMap.get("update"));
                convertToFormDataObject(newUnpublishedFormDataMap, "limit", updateMap.get("limit"));
                break;
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
