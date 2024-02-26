package com.appsmith.server.migrations;

import com.appsmith.external.converters.ISOStringToInstantConverter;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PricingPlan;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.migrations.solutions.UpdateSuperUserMigrationHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.solutions.PolicySolution;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.google.gson.GsonBuilder;
import io.changock.migration.api.annotations.NonLockGuarded;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StreamUtils;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_ENV;
import static com.appsmith.server.acl.AclPermission.READ_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUP_MEMBERS;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.acl.AppsmithRole.TENANT_ADMIN;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.helpers.CollectionUtils.findSymmetricDiff;
import static com.appsmith.server.migrations.DatabaseChangelog1.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog1.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog1.getUpdatedDynamicBindingPathList;
import static com.appsmith.server.migrations.DatabaseChangelog1.installPluginToAllWorkspaces;
import static com.appsmith.server.migrations.DatabaseChangelog1.makeIndex;
import static com.appsmith.server.migrations.MigrationHelperMethods.evictPermissionCacheForUsers;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.data.mongodb.core.query.Update.update;

@Slf4j
@ChangeLog(order = "002")
public class DatabaseChangelog2 {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern sheetRangePattern =
            Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?[^\"]*");

    private final UpdateSuperUserMigrationHelper updateSuperUserMigrationHelper = new UpdateSuperUserMigrationHelper();

    @ChangeSet(order = "001", id = "fix-plugin-title-casing", author = "")
    public void fixPluginTitleCasing(MongoTemplate mongoTemplate) {
        mongoTemplate.updateFirst(
                query(where(Plugin.Fields.packageName).is("mysql-plugin")),
                update(Plugin.Fields.name, "MySQL"),
                Plugin.class);

        mongoTemplate.updateFirst(
                query(where(Plugin.Fields.packageName).is("mssql-plugin")),
                update(Plugin.Fields.name, "Microsoft SQL Server"),
                Plugin.class);

        mongoTemplate.updateFirst(
                query(where(Plugin.Fields.packageName).is("elasticsearch-plugin")),
                update(Plugin.Fields.name, "Elasticsearch"),
                Plugin.class);
    }

    public static void migrateFirestoreActionsFormData(NewAction uqiAction) {
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
        if (StringUtils.hasLength(unpublishedBody)) {
            convertToFormDataObject(unpublishedFormData, "body", unpublishedBody);
            unpublishedAction.getActionConfiguration().setBody(null);
        }

        final String unpublishedPath =
                unpublishedAction.getActionConfiguration().getPath();
        if (StringUtils.hasLength(unpublishedPath)) {
            convertToFormDataObject(unpublishedFormData, "path", unpublishedPath);
            unpublishedAction.getActionConfiguration().setPath(null);
        }

        final String unpublishedNext =
                unpublishedAction.getActionConfiguration().getNext();
        if (StringUtils.hasLength(unpublishedNext)) {
            convertToFormDataObject(unpublishedFormData, "next", unpublishedNext);
            unpublishedAction.getActionConfiguration().setNext(null);
        }

        final String unpublishedPrev =
                unpublishedAction.getActionConfiguration().getPrev();
        if (StringUtils.hasLength(unpublishedPrev)) {
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
            if (StringUtils.hasLength(publishedBody)) {
                convertToFormDataObject(publishedFormData, "body", publishedBody);
                publishedAction.getActionConfiguration().setBody(null);
            }

            final String publishedPath =
                    publishedAction.getActionConfiguration().getPath();
            if (StringUtils.hasLength(publishedPath)) {
                convertToFormDataObject(publishedFormData, "path", publishedPath);
                publishedAction.getActionConfiguration().setPath(null);
            }

            final String publishedNext =
                    publishedAction.getActionConfiguration().getNext();
            if (StringUtils.hasLength(publishedNext)) {
                convertToFormDataObject(publishedFormData, "next", publishedNext);
                publishedAction.getActionConfiguration().setNext(null);
            }

            final String publishedPrev =
                    publishedAction.getActionConfiguration().getPrev();
            if (StringUtils.hasLength(publishedPrev)) {
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
        if (StringUtils.hasLength(body)) {
            convertToFormDataObject(f, "body", body);
            action.getActionConfiguration().setBody(null);
        }

        final String path = action.getActionConfiguration().getPath();
        if (StringUtils.hasLength(path)) {
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
        if (StringUtils.hasLength(body)) {
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

    /**
     * This migration introduces indexes on newAction, actionCollection, newPage to improve the query performance for
     * queries like getResourceByDefaultAppIdAndGitSyncId which excludes the deleted entries.
     */
    @ChangeSet(order = "007", id = "update-git-indexes", author = "")
    public void addIndexesForGit(MongoTemplate mongoTemplate) {
        doAddIndexesForGit(mongoTemplate);
    }

    public static void doAddIndexesForGit(MongoTemplate mongoTemplate) {
        String defaultResources = BranchAwareDomain.Fields.defaultResources;
        ensureIndexes(
                mongoTemplate,
                ActionCollection.class,
                makeIndex(
                                defaultResources + "." + FieldName.APPLICATION_ID,
                                BaseDomain.Fields.gitSyncId,
                                FieldName.DELETED)
                        .named("defaultApplicationId_gitSyncId_deleted"));

        ensureIndexes(
                mongoTemplate,
                NewAction.class,
                makeIndex(
                                defaultResources + "." + FieldName.APPLICATION_ID,
                                BaseDomain.Fields.gitSyncId,
                                FieldName.DELETED)
                        .named("defaultApplicationId_gitSyncId_deleted"));

        ensureIndexes(
                mongoTemplate,
                NewPage.class,
                makeIndex(
                                defaultResources + "." + FieldName.APPLICATION_ID,
                                BaseDomain.Fields.gitSyncId,
                                FieldName.DELETED)
                        .named("defaultApplicationId_gitSyncId_deleted"));
    }

    /**
     * We are creating indexes manually because Spring's index resolver creates indexes on fields as well.
     * See https://stackoverflow.com/questions/60867491/ for an explanation of the problem. We have that problem with
     * the `Action.datasource` field.
     */
    @ChangeSet(order = "010", id = "add-workspace-indexes", author = "")
    public void addWorkspaceIndexes(MongoTemplate mongoTemplate) {
        ensureIndexes(mongoTemplate, Workspace.class, makeIndex("createdAt"));
    }

    @ChangeSet(order = "012", id = "add-default-tenant", author = "")
    public void addDefaultTenant(MongoTemplate mongoTemplate) {

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is("default"));
        Tenant tenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        // if tenant already exists, don't create a new one.
        if (tenant != null) {
            return;
        }

        Tenant defaultTenant = new Tenant();
        defaultTenant.setDisplayName("Default");
        defaultTenant.setSlug("default");
        defaultTenant.setPricingPlan(PricingPlan.FREE);

        mongoTemplate.save(defaultTenant);
    }

    @ChangeSet(order = "016", id = "organization-to-workspace-indexes-recreate", author = "")
    public void organizationToWorkspaceIndexesRecreate(MongoTemplate mongoTemplate) {
        // If this migration is re-run
        dropIndexIfExists(mongoTemplate, Application.class, "workspace_app_deleted_gitApplicationMetadata");
        dropIndexIfExists(mongoTemplate, Datasource.class, "workspace_datasource_deleted_compound_index");

        ensureIndexes(
                mongoTemplate,
                Application.class,
                makeIndex(
                                Application.Fields.workspaceId,
                                Application.Fields.name,
                                Application.Fields.deletedAt,
                                "gitApplicationMetadata.remoteUrl",
                                "gitApplicationMetadata.branchName")
                        .unique()
                        .named("workspace_app_deleted_gitApplicationMetadata"));
        ensureIndexes(
                mongoTemplate,
                Datasource.class,
                makeIndex(Datasource.Fields.workspaceId, Datasource.Fields.name, Datasource.Fields.deletedAt)
                        .unique()
                        .named("workspace_datasource_deleted_compound_index"));
    }

    public static void migrateGoogleSheetsToUqi(NewAction uqiAction) {

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

    @ChangeSet(order = "021", id = "flush-spring-redis-keys-2a", author = "")
    public void clearRedisCache2(ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        DatabaseChangelog1.doClearRedisKeys(reactiveRedisOperations);
    }

    @ChangeSet(order = "023", id = "add-anonymousUser", author = "")
    public void addAnonymousUser(MongoTemplate mongoTemplate) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is("default"));
        Tenant tenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        Query userQuery = new Query();
        userQuery
                .addCriteria(where(User.Fields.email).is(FieldName.ANONYMOUS_USER))
                .addCriteria(where(User.Fields.tenantId).is(tenant.getId()));
        User anonymousUser = mongoTemplate.findOne(userQuery, User.class);

        if (anonymousUser == null) {
            anonymousUser = new User();
            anonymousUser.setName(FieldName.ANONYMOUS_USER);
            anonymousUser.setEmail(FieldName.ANONYMOUS_USER);
            anonymousUser.setCurrentWorkspaceId("");
            anonymousUser.setWorkspaceIds(new HashSet<>());
            anonymousUser.setIsAnonymous(true);
            anonymousUser.setTenantId(tenant.getId());

            mongoTemplate.save(anonymousUser);
        }
    }

    @ChangeSet(order = "029", id = "add-instance-config-object", author = "")
    public void addInstanceConfigurationPlaceHolder(MongoTemplate mongoTemplate) {
        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        if (instanceAdminConfiguration != null) {
            return;
        }

        instanceAdminConfiguration = new Config();
        instanceAdminConfiguration.setName(FieldName.INSTANCE_CONFIG);
        Config savedInstanceConfig = mongoTemplate.save(instanceAdminConfiguration);

        // Create instance management permission group
        PermissionGroup instanceManagerPermissionGroup = new PermissionGroup();
        instanceManagerPermissionGroup.setName(FieldName.INSTANCE_ADMIN_ROLE);
        instanceManagerPermissionGroup.setPermissions(
                Set.of(new Permission(savedInstanceConfig.getId(), MANAGE_INSTANCE_CONFIGURATION)));

        Query adminUserQuery = new Query();
        adminUserQuery.addCriteria(
                where(BaseDomain.Fields.policies).elemMatch(where("permission").is(MANAGE_INSTANCE_ENV.getValue())));
        List<User> adminUsers = mongoTemplate.find(adminUserQuery, User.class);

        instanceManagerPermissionGroup.setAssignedToUserIds(
                adminUsers.stream().map(User::getId).collect(Collectors.toSet()));

        PermissionGroup savedPermissionGroup = mongoTemplate.save(instanceManagerPermissionGroup);

        // Update the instance config with the permission group id
        savedInstanceConfig.setConfig(new JSONObject(Map.of(DEFAULT_PERMISSION_GROUP, savedPermissionGroup.getId())));

        Policy editConfigPolicy = Policy.builder()
                .permission(MANAGE_INSTANCE_CONFIGURATION.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();
        Policy readConfigPolicy = Policy.builder()
                .permission(READ_INSTANCE_CONFIGURATION.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        savedInstanceConfig.setPolicies(new HashSet<>(Set.of(editConfigPolicy, readConfigPolicy)));

        mongoTemplate.save(savedInstanceConfig);

        // Also give the permission group permission to unassign & assign & read to itself
        Policy updatePermissionGroupPolicy = Policy.builder()
                .permission(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        Policy assignPermissionGroupPolicy = Policy.builder()
                .permission(ASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        savedPermissionGroup.setPolicies(
                new HashSet<>(Set.of(updatePermissionGroupPolicy, assignPermissionGroupPolicy)));

        Set<Permission> permissions = new HashSet<>(savedPermissionGroup.getPermissions());
        permissions.addAll(Set.of(
                new Permission(savedPermissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS),
                new Permission(savedPermissionGroup.getId(), ASSIGN_PERMISSION_GROUPS),
                new Permission(savedPermissionGroup.getId(), READ_PERMISSION_GROUP_MEMBERS)));
        savedPermissionGroup.setPermissions(permissions);

        mongoTemplate.save(savedPermissionGroup);
    }

    @ChangeSet(order = "030", id = "add-anonymous-user-permission-group", author = "")
    public void addAnonymousUserPermissionGroup(MongoTemplate mongoTemplate) {
        Query anonymousUserPermissionConfig = new Query();
        anonymousUserPermissionConfig.addCriteria(where(Config.Fields.name).is(FieldName.PUBLIC_PERMISSION_GROUP));

        Config publicPermissionGroupConfig = mongoTemplate.findOne(anonymousUserPermissionConfig, Config.class);

        if (publicPermissionGroupConfig != null) {
            return;
        }

        PermissionGroup publicPermissionGroup = new PermissionGroup();
        publicPermissionGroup.setName(FieldName.PUBLIC_PERMISSION_GROUP);
        publicPermissionGroup.setDescription("Role for giving accesses for all objects to anonymous users");

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is("default"));
        Tenant tenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        Query userQuery = new Query();
        userQuery
                .addCriteria(where(User.Fields.email).is(FieldName.ANONYMOUS_USER))
                .addCriteria(where(User.Fields.tenantId).is(tenant.getId()));
        User anonymousUser = mongoTemplate.findOne(userQuery, User.class);

        // Give access to anonymous user to the permission group.
        publicPermissionGroup.setAssignedToUserIds(Set.of(anonymousUser.getId()));
        PermissionGroup savedPermissionGroup = mongoTemplate.save(publicPermissionGroup);

        publicPermissionGroupConfig = new Config();
        publicPermissionGroupConfig.setName(FieldName.PUBLIC_PERMISSION_GROUP);

        publicPermissionGroupConfig.setConfig(
                new JSONObject(Map.of(PERMISSION_GROUP_ID, savedPermissionGroup.getId())));

        mongoTemplate.save(publicPermissionGroupConfig);
        return;
    }

    @ChangeSet(order = "031", id = "create-themes-indices", author = "")
    public void createThemesIndices(MongoTemplate mongoTemplate) {

        Index systemThemeIndex = new Index()
                .on(Theme.Fields.isSystemTheme, Sort.Direction.ASC)
                .named("system_theme_index")
                .background();

        Index applicationIdIndex = new Index()
                .on(Theme.Fields.applicationId, Sort.Direction.ASC)
                .on(FieldName.DELETED, Sort.Direction.ASC)
                .named("application_id_index")
                .background();

        dropIndexIfExists(mongoTemplate, Theme.class, "system_theme_index");
        dropIndexIfExists(mongoTemplate, Theme.class, "application_id_index");
        ensureIndexes(mongoTemplate, Theme.class, systemThemeIndex, applicationIdIndex);
    }

    // The order 031-a is ensured to run after 031, as theme indices might be a requirement.
    @ChangeSet(order = "031-a", id = "create-system-themes-v3", author = "", runAlways = true)
    public void createSystemThemes3(MongoTemplate mongoTemplate) throws IOException {

        final String themesJson = StreamUtils.copyToString(
                new DefaultResourceLoader().getResource("system-themes.json").getInputStream(),
                Charset.defaultCharset());

        Theme[] themes = new GsonBuilder()
                .registerTypeAdapter(Instant.class, new ISOStringToInstantConverter())
                .create()
                .fromJson(themesJson, Theme[].class);

        // Make this theme accessible to anonymous users.
        Query anonymousUserPermissionConfig = new Query();
        anonymousUserPermissionConfig.addCriteria(where(Config.Fields.name).is(FieldName.PUBLIC_PERMISSION_GROUP));
        Config publicPermissionGroupConfig = mongoTemplate.findOne(anonymousUserPermissionConfig, Config.class);

        String permissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);

        PermissionGroup publicPermissionGroup =
                mongoTemplate.findOne(query(where("_id").is(permissionGroupId)), PermissionGroup.class);

        // Initialize the permissions for the role
        HashSet<Permission> permissions = new HashSet<>();
        if (publicPermissionGroup.getPermissions() != null) {
            permissions.addAll(publicPermissionGroup.getPermissions());
        }

        Policy policyWithCurrentPermission = Policy.builder()
                .permission(READ_THEMES.getValue())
                .permissionGroups(Set.of(publicPermissionGroup.getId()))
                .build();

        for (Theme theme : themes) {
            theme.setSystemTheme(true);
            theme.setCreatedAt(Instant.now());
            theme.setPolicies(new HashSet<>(Set.of(policyWithCurrentPermission)));
            Query query = new Query(Criteria.where(Theme.Fields.name)
                    .is(theme.getName())
                    .and(Theme.Fields.isSystemTheme)
                    .is(true));

            Theme savedTheme = mongoTemplate.findOne(query, Theme.class);
            if (savedTheme == null) { // this theme does not exist, create it
                savedTheme = mongoTemplate.save(theme);
            } else { // theme already found, update
                savedTheme.setDisplayName(theme.getDisplayName());
                savedTheme.setPolicies(theme.getPolicies());
                savedTheme.setConfig(theme.getConfig());
                savedTheme.setProperties(theme.getProperties());
                savedTheme.setStylesheet(theme.getStylesheet());
                if (savedTheme.getCreatedAt() == null) {
                    savedTheme.setCreatedAt(Instant.now());
                }
                mongoTemplate.save(savedTheme);
            }

            // Add the access to this theme to the public permission group
            Theme finalSavedTheme = savedTheme;
            boolean isThemePermissionPresent = permissions.stream()
                    .filter(p -> p.getAclPermission().equals(READ_THEMES)
                            && p.getDocumentId().equals(finalSavedTheme.getId()))
                    .findFirst()
                    .isPresent();
            if (!isThemePermissionPresent) {
                permissions.add(new Permission(finalSavedTheme.getId(), READ_THEMES));
            }
        }

        // Finally save the role which gives access to all the system themes to the anonymous user.
        publicPermissionGroup.setPermissions(permissions);
        mongoTemplate.save(publicPermissionGroup);
    }

    @ChangeSet(order = "032", id = "create-indices-on-permissions-for-performance", author = "")
    public void addPermissionGroupIndex(MongoTemplate mongoTemplate) {
        doAddPermissionGroupIndex(mongoTemplate);
    }

    public static void doAddPermissionGroupIndex(MongoTemplate mongoTemplate) {

        dropIndexIfExists(mongoTemplate, PermissionGroup.class, "permission_group_workspace_deleted_compound_index");
        dropIndexIfExists(
                mongoTemplate, PermissionGroup.class, "permission_group_assignedUserIds_deleted_compound_index");
        dropIndexIfExists(mongoTemplate, PermissionGroup.class, "permission_group_assignedUserIds_deleted");

        Index assignedToUserIds_deleted_compound_index = makeIndex(
                        PermissionGroup.Fields.assignedToUserIds, FieldName.DELETED)
                .named("permission_group_assignedUserIds_deleted");

        ensureIndexes(mongoTemplate, PermissionGroup.class, assignedToUserIds_deleted_compound_index);
    }

    /**
     * Changing the order of this function to 10000 so that it always gets executed at the end.
     * This ensures that any permission changes for super users happen once all other migrations are completed
     *
     * @param mongoTemplate
     * @param cacheableRepositoryHelper
     */
    @ChangeSet(order = "10000", id = "update-super-users", author = "", runAlways = true)
    public void updateSuperUsers(
            MongoTemplate mongoTemplate,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            PolicySolution policySolution,
            PolicyGenerator policyGenerator) {
        // Read the admin emails from the environment and update the super users accordingly
        String adminEmailsStr = System.getenv(String.valueOf(APPSMITH_ADMIN_EMAILS));

        Set<String> adminEmails = TextUtils.csvToSet(adminEmailsStr);

        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        String instanceAdminPermissionGroupId =
                (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query permissionGroupQuery = new Query();
        permissionGroupQuery
                .addCriteria(where(PermissionGroup.Fields.id).is(instanceAdminPermissionGroupId))
                .fields()
                .include(PermissionGroup.Fields.assignedToUserIds);
        PermissionGroup instanceAdminPG = mongoTemplate.findOne(permissionGroupQuery, PermissionGroup.class);

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is("default"));
        Tenant tenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        Set<String> userIds = adminEmails.stream()
                .map(email -> email.trim())
                .map(String::toLowerCase)
                .map(email -> {
                    Query userQuery = new Query();
                    userQuery.addCriteria(where(User.Fields.email).is(email));
                    User user = mongoTemplate.findOne(userQuery, User.class);

                    if (user == null) {
                        log.info("Creating super user with username {}", email);
                        user = updateSuperUserMigrationHelper.createNewUser(
                                email, tenant, instanceAdminPG, mongoTemplate, policySolution, policyGenerator);
                    }

                    return user.getId();
                })
                .collect(Collectors.toSet());

        Set<String> oldSuperUsers = instanceAdminPG.getAssignedToUserIds();
        Set<String> updatedUserIds = findSymmetricDiff(oldSuperUsers, userIds);
        evictPermissionCacheForUsers(updatedUserIds, mongoTemplate, cacheableRepositoryHelper);

        Update update = new Update().set(PermissionGroup.Fields.assignedToUserIds, userIds);
        mongoTemplate.updateFirst(permissionGroupQuery, update, PermissionGroup.class);
    }

    @ChangeSet(order = "034", id = "update-bad-theme-state", author = "")
    public void updateBadThemeState(
            MongoTemplate mongoTemplate,
            @NonLockGuarded PolicyGenerator policyGenerator,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        Query query = new Query();
        query.addCriteria(new Criteria()
                .andOperator(
                        new Criteria(Theme.Fields.isSystemTheme).is(false), new Criteria(FieldName.DELETED).is(false)));

        mongoTemplate.stream(query, Theme.class).forEach(theme -> {
            Query applicationQuery = new Query();
            Criteria themeCriteria = new Criteria(Application.Fields.editModeThemeId)
                    .is(theme.getId())
                    .orOperator(new Criteria(Application.Fields.publishedModeThemeId).is(theme.getId()));

            List<Application> applications =
                    mongoTemplate.find(applicationQuery.addCriteria(themeCriteria), Application.class);
            // This is an erroneous state where the theme is being used by multiple applications
            if (applications != null && applications.size() > 1) {
                // Create new themes for the rest of the applications which are copies of the original theme
                for (int i = 0; i < applications.size(); i++) {
                    Application application = applications.get(i);
                    Set<Policy> themePolicies = policyGenerator.getAllChildPolicies(
                            application.getPolicies(), Application.class, Theme.class);

                    if (i == 0) {
                        // Don't create a new theme for the first application
                        // Just update the policies
                        theme.setPolicies(themePolicies);
                        mongoTemplate.save(theme);
                    } else {

                        Theme newTheme = new Theme();
                        newTheme.setSystemTheme(false);
                        newTheme.setName(theme.getName());
                        newTheme.setDisplayName(theme.getDisplayName());
                        newTheme.setConfig(theme.getConfig());
                        newTheme.setStylesheet(theme.getStylesheet());
                        newTheme.setProperties(theme.getProperties());
                        newTheme.setCreatedAt(Instant.now());
                        newTheme.setUpdatedAt(Instant.now());
                        newTheme.setPolicies(themePolicies);

                        newTheme = mongoTemplate.save(newTheme);

                        if (application.getEditModeThemeId().equals(theme.getId())) {
                            application.setEditModeThemeId(newTheme.getId());
                        }
                        if (application.getPublishedModeThemeId().equals(theme.getId())) {
                            application.setPublishedModeThemeId(newTheme.getId());
                        }
                        mongoTemplate.save(application);
                    }
                }
            }
        });
    }

    @ChangeSet(order = "036", id = "add-graphql-plugin", author = "")
    public void addGraphQLPlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Authenticated GraphQL API");
        plugin.setType(PluginType.API);
        plugin.setPackageName("graphql-plugin");
        plugin.setUiComponent("GraphQLEditorForm");
        plugin.setDatasourceComponent("RestAPIDatasourceForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/graphql.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/reference/datasources/querying-graphql-db");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "035", id = "add-tenant-admin-permissions-instance-admin", author = "")
    public void addTenantAdminPermissionsToInstanceAdmin(
            MongoTemplate mongoTemplate, @NonLockGuarded PolicySolution policySolution) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(Tenant.Fields.slug).is("default"));
        Tenant defaultTenant = mongoTemplate.findOne(tenantQuery, Tenant.class);

        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(Config.Fields.name).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongoTemplate.findOne(instanceConfigurationQuery, Config.class);

        String instanceAdminPermissionGroupId =
                (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query permissionGroupQuery = new Query();
        permissionGroupQuery.addCriteria(where(PermissionGroup.Fields.id).is(instanceAdminPermissionGroupId));

        PermissionGroup instanceAdminPGBeforeChanges =
                mongoTemplate.findOne(permissionGroupQuery, PermissionGroup.class);

        // Give read permission to instanceAdminPg to all the users who have been assigned this permission group
        Map<String, Policy> readPermissionGroupPolicyMap = Map.of(
                READ_PERMISSION_GROUP_MEMBERS.getValue(),
                Policy.builder()
                        .permission(READ_PERMISSION_GROUP_MEMBERS.getValue())
                        .permissionGroups(Set.of(instanceAdminPGBeforeChanges.getId()))
                        .build());
        PermissionGroup instanceAdminPG =
                policySolution.addPoliciesToExistingObject(readPermissionGroupPolicyMap, instanceAdminPGBeforeChanges);

        // Now add admin permissions to the tenant
        Set<Permission> tenantPermissions = TENANT_ADMIN.getPermissions().stream()
                .map(permission -> new Permission(defaultTenant.getId(), permission))
                .collect(Collectors.toSet());
        HashSet<Permission> permissions = new HashSet<>(instanceAdminPG.getPermissions());
        permissions.addAll(tenantPermissions);
        instanceAdminPG.setPermissions(permissions);
        mongoTemplate.save(instanceAdminPG);

        Map<String, Policy> tenantPolicy =
                policySolution.generatePolicyFromPermissionGroupForObject(instanceAdminPG, defaultTenant.getId());
        Tenant updatedTenant = policySolution.addPoliciesToExistingObject(tenantPolicy, defaultTenant);
        mongoTemplate.save(updatedTenant);
    }

    @ChangeSet(order = "039", id = "change-readPermissionGroup-to-readPermissionGroupMembers", author = "")
    public void modifyReadPermissionGroupToReadPermissionGroupMembers(
            MongoTemplate mongoTemplate, @NonLockGuarded PolicySolution policySolution) {

        Query query = new Query(Criteria.where("policies.permission").is("read:permissionGroups"));
        Update update = new Update().set("policies.$.permission", "read:permissionGroupMembers");
        mongoTemplate.updateMulti(query, update, PermissionGroup.class);
    }

    @ChangeSet(order = "040", id = "delete-permissions-in-permissionGroups", author = "")
    public void deletePermissionsInPermissionGroups(MongoTemplate mongoTemplate) {
        Query query = new Query();
        Update update = new Update().set("permissions", List.of());
        mongoTemplate.updateMulti(query, update, PermissionGroup.class);
    }

    private Query getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(Plugin plugin) {
        Criteria pluginIdMatchesSuppliedPluginId = where("pluginId").is(plugin.getId());
        Criteria isNotDeleted = where("deleted").ne(true);
        return query((new Criteria()).andOperator(pluginIdMatchesSuppliedPluginId, isNotDeleted));
    }

    @ChangeSet(order = "037", id = "indices-recommended-by-mongodb-cloud", author = "")
    public void addIndicesRecommendedByMongoCloud(MongoTemplate mongoTemplate) {
        dropIndexIfExists(mongoTemplate, NewPage.class, "deleted");
        ensureIndexes(mongoTemplate, NewPage.class, makeIndex("deleted"));

        dropIndexIfExists(mongoTemplate, Application.class, "deleted");
        ensureIndexes(mongoTemplate, Application.class, makeIndex("deleted"));

        dropIndexIfExists(mongoTemplate, Workspace.class, "tenantId_deleted");
        ensureIndexes(
                mongoTemplate, Workspace.class, makeIndex("tenantId", "deleted").named("tenantId_deleted"));
    }

    @ChangeSet(order = "038", id = "add-unique-index-for-uidstring", author = "")
    public void addUniqueIndexOnUidString(MongoTemplate mongoTemplate) {
        Index uidStringUniqueness = makeIndex("uidString").unique().named("customjslibs_uidstring_index");
        ensureIndexes(mongoTemplate, CustomJSLib.class, uidStringUniqueness);
    }

    // ----------------------------------------------------
    // v1.9.2 Checkpoint
    // ----------------------------------------------------

    // Migration to drop usage pulse collection for Appsmith cloud as we will not be logging these pulses unless
    // multi-tenancy is introduced
    @ChangeSet(order = "040", id = "remove-usage-pulses-for-appsmith-cloud", author = "")
    public void removeUsagePulsesForAppsmithCloud(
            MongoTemplate mongoTemplate, @NonLockGuarded CommonConfig commonConfig) {
        if (Boolean.TRUE.equals(commonConfig.isCloudHosting())) {
            mongoTemplate.dropCollection(UsagePulse.class);
        }
    }

    /**
     * We are introducing SSL settings config for MSSQL, hence this migration configures older existing datasources
     * with a setting that matches their current configuration (i.e. set to `disabled` since they have been running
     * with encryption disabled post the Spring 6 upgrade).
     *
     */
    @ChangeSet(order = "041", id = "add-ssl-mode-settings-for-existing-mssql-datasources", author = "")
    public void addSslModeSettingsForExistingMssqlDatasource(MongoTemplate mongoTemplate) {
        Plugin mssqlPlugin = mongoTemplate.findOne(query(where("packageName").is("mssql-plugin")), Plugin.class);
        Query queryToGetDatasources = getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(mssqlPlugin);

        Update update = new Update();
        update.set("datasourceConfiguration.connection.ssl.authType", "DISABLE");
        mongoTemplate.updateMulti(queryToGetDatasources, update, Datasource.class);
    }

    @ChangeSet(order = "042", id = "add-oracle-plugin", author = "")
    public void addOraclePlugin(MongoTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("Oracle");
        plugin.setType(PluginType.DB);
        plugin.setPackageName("oracle-plugin");
        plugin.setUiComponent("DbEditorForm");
        plugin.setResponseType(Plugin.ResponseType.TABLE);
        plugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg");
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/querying-oracle");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }
        installPluginToAllWorkspaces(mongoTemplate, plugin.getId());
    }

    @ChangeSet(order = "043", id = "update-oracle-plugin-name", author = "")
    public void updateOraclePluginName(MongoTemplate mongoTemplate) {
        Plugin oraclePlugin = mongoTemplate.findOne(query(where("packageName").is("oracle-plugin")), Plugin.class);
        oraclePlugin.setName("Oracle");
        oraclePlugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg");
        mongoTemplate.save(oraclePlugin);
    }
}
