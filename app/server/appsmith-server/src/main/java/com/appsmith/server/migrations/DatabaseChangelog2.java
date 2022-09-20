package com.appsmith.server.migrations;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.external.models.QDatasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.PricingPlan;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QComment;
import com.appsmith.server.domains.QCommentThread;
import com.appsmith.server.domains.QConfig;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QNewPage;
import com.appsmith.server.domains.QOrganization;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.QTheme;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.QUserData;
import com.appsmith.server.domains.QWorkspace;
import com.appsmith.server.domains.Sequence;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.github.cloudyrock.mongock.driver.mongodb.springdata.v3.decorator.impl.MongockTemplate;
import com.google.gson.Gson;
import com.querydsl.core.types.Path;
import io.changock.migration.api.annotations.NonLockGuarded;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import net.minidev.json.JSONObject;
import org.bson.types.ObjectId;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.aggregation.AggregationUpdate;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StreamUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.nio.charset.Charset;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_ENV;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.READ_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.constants.EnvVariables.APPSMITH_ADMIN_EMAILS;
import static com.appsmith.server.constants.FieldName.DEFAULT_PERMISSION_GROUP;
import static com.appsmith.server.constants.FieldName.PERMISSION_GROUP_ID;
import static com.appsmith.server.helpers.CollectionUtils.findSymmetricDiff;
import static com.appsmith.server.migrations.DatabaseChangelog.dropIndexIfExists;
import static com.appsmith.server.migrations.DatabaseChangelog.ensureIndexes;
import static com.appsmith.server.migrations.DatabaseChangelog.getUpdatedDynamicBindingPathList;
import static com.appsmith.server.migrations.DatabaseChangelog.installPluginToAllWorkspaces;
import static com.appsmith.server.migrations.DatabaseChangelog.makeIndex;
import static com.appsmith.server.migrations.MigrationHelperMethods.evictPermissionCacheForUsers;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static java.lang.Boolean.TRUE;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;


@Slf4j
@ChangeLog(order = "002")
public class DatabaseChangelog2 {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern sheetRangePattern = Pattern.compile("https://docs.google.com/spreadsheets/d/([^/]+)/?[^\"]*");

    @ChangeSet(order = "001", id = "fix-plugin-title-casing", author = "")
    public void fixPluginTitleCasing(MongockTemplate mongockTemplate) {
        mongockTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("mysql-plugin")),
                Update.update(fieldName(QPlugin.plugin.name), "MySQL"),
                Plugin.class);

        mongockTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("mssql-plugin")),
                Update.update(fieldName(QPlugin.plugin.name), "Microsoft SQL Server"),
                Plugin.class);

        mongockTemplate.updateFirst(
                query(where(fieldName(QPlugin.plugin.packageName)).is("elasticsearch-plugin")),
                Update.update(fieldName(QPlugin.plugin.name), "Elasticsearch"),
                Plugin.class);
    }

    @ChangeSet(order = "002", id = "deprecate-archivedAt-in-action", author = "")
    public void deprecateArchivedAtForNewAction(MongockTemplate mongockTemplate) {
        // Update actions
        final Query actionQuery = query(where(fieldName(QNewAction.newAction.applicationId)).exists(true))
                .addCriteria(where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.archivedAt)).exists(true));

        actionQuery.fields()
                .include(fieldName(QNewAction.newAction.id))
                .include(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.archivedAt));

        List<NewAction> actions = mongockTemplate.find(actionQuery, NewAction.class);

        for (NewAction action : actions) {

            final Update update = new Update();

            ActionDTO unpublishedAction = action.getUnpublishedAction();
            if (unpublishedAction != null) {
                final Instant archivedAt = unpublishedAction.getArchivedAt();
                update.set(
                        fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.deletedAt),
                        archivedAt);
                update.unset(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.archivedAt));
            }
            mongockTemplate.updateFirst(
                    query(where(fieldName(QNewAction.newAction.id)).is(action.getId())),
                    update,
                    NewAction.class);
        }
    }

    /**
     * To be able to support form and raw mode in the UQI compatible plugins,
     * we need to be migrating all existing data to the data and formData path.
     * Anything that was already raw would not be within formData,
     * so we can blindly switch the contents of formData into inner objects
     * Example: formData.limit will transform to formData.limit.data and
     * formData.limit.formData
     *
     * @param mongockTemplate
     */
    @ChangeSet(order = "003", id = "update-form-data-for-uqi-mode", author = "")
    public void updateActionFormDataPath(MongockTemplate mongockTemplate) {

        // Get all plugin references to Mongo, S3 and Firestore actions
        List<Plugin> uqiPlugins = mongockTemplate.find(
                query(where("packageName").in("mongo-plugin", "amazons3-plugin", "firestore-plugin")),
                Plugin.class);

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
                NewAction.class);

        // Retrieve the formData path for all actions
        for (NewAction uqiActionWithId : uqiActions) {

            // Fetch one action at a time to avoid OOM.
            final NewAction uqiAction = mongockTemplate.findOne(
                    query(where(fieldName(QNewAction.newAction.id)).is(uqiActionWithId.getId())),
                    NewAction.class);

            assert uqiAction != null;
            ActionDTO unpublishedAction = uqiAction.getUnpublishedAction();

            /* No migrations required if action configuration does not exist. */
            if (unpublishedAction == null || unpublishedAction.getActionConfiguration() == null) {
                continue;
            }

            try {
                if (pluginMap.get(uqiAction.getPluginId()).equals("firestore-plugin")) {
                    migrateFirestoreActionsFormData(uqiAction);
                } else if (pluginMap.get(uqiAction.getPluginId()).equals("amazons3-plugin")) {
                    migrateAmazonS3ActionsFormData(uqiAction);
                } else {
                    migrateMongoActionsFormData(uqiAction);
                }
            } catch (AppsmithException e) {
                // This action is already migrated, move on
                log.error("Failed with error: {}", e.getMessage());
                log.error("Failing action: {}", uqiAction.getId());
                continue;
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
            final Object command = unpublishedFormData.get("command");

            if (!(command instanceof String)) {
                throw new AppsmithException(AppsmithError.MIGRATION_ERROR);
            }

            unpublishedFormData
                    .keySet()
                    .stream()
                    .forEach(k -> {
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

            final Object command = publishedFormData.get("command");

            if (!(command instanceof String)) {
                throw new AppsmithException(AppsmithError.MIGRATION_ERROR);
            }

            publishedFormData
                    .keySet()
                    .stream()
                    .forEach(k -> {
                        if (k != null) {
                            final Object oldValue = publishedFormData.get(k);
                            final HashMap<String, Object> map = new HashMap<>();
                            map.put("data", oldValue);
                            map.put("componentData", oldValue);
                            map.put("viewType", "component");
                            publishedFormData.put(k, map);
                        }
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
         * Please note that there is no requirement to migrate the dynamic binding path
         * list for published actions
         * since the `on page load` actions do not get computed on published actions
         * data. They are only computed
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
        convertToFormDataObject(formDataMap, key, value, false);
    }

    private static void convertToFormDataObject(Map<String, Object> formDataMap, String key, Object value, boolean hasBinding) {
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
            dynamicBindingPathList
                    .stream()
                    .forEach(dynamicBindingPath -> {
                        final String currentBinding = dynamicBindingPath.getKey();
                        final Optional<String> matchingBinding = dynamicBindingMapper.keySet().stream()
                                .filter(currentBinding::startsWith).findFirst();
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
            dynamicBindingPathList
                    .stream()
                    .forEach(dynamicBindingPath -> {
                        final String currentBinding = dynamicBindingPath.getKey();
                        final Optional<String> matchingBinding = dynamicBindingMapper.keySet().stream()
                                .filter(currentBinding::startsWith).findFirst();
                        if (matchingBinding.isPresent()) {
                            final String newBindingPrefix = dynamicBindingMapper.get(matchingBinding.get());
                            dynamicBindingPath.setKey(currentBinding.replace(matchingBinding.get(), newBindingPrefix));
                        }
                    });
        }
    }

    /**
     * Insert isConfigured boolean to check if the datasource is correctly
     * configured. This field will be used during
     * the file or git import to maintain the datasource configuration state
     *
     * @param mongockTemplate
     */
    @ChangeSet(order = "004", id = "add-isConfigured-flag-for-all-datasources", author = "")
    public void updateIsConfiguredFlagForAllTheExistingDatasources(MongockTemplate mongockTemplate) {
        final Query datasourceQuery = query(where(fieldName(QDatasource.datasource.deleted)).ne(true))
                .addCriteria(where(fieldName(QDatasource.datasource.invalids)).size(0));
        datasourceQuery.fields()
                .include(fieldName(QDatasource.datasource.id));

        List<Datasource> datasources = mongockTemplate.find(datasourceQuery, Datasource.class);
        for (Datasource datasource : datasources) {
            final Update update = new Update();
            update.set(fieldName(QDatasource.datasource.isConfigured), TRUE);
            mongockTemplate.updateFirst(
                    query(where(fieldName(QDatasource.datasource.id)).is(datasource.getId())),
                    update,
                    Datasource.class);
        }
    }

    @ChangeSet(order = "005", id = "set-application-version", author = "")
    public void setDefaultApplicationVersion(MongockTemplate mongockTemplate) {
        mongockTemplate.updateMulti(
                Query.query(where(fieldName(QApplication.application.deleted)).is(false)),
                Update.update(fieldName(QApplication.application.applicationVersion),
                        ApplicationVersion.EARLIEST_VERSION),
                Application.class);
    }

    @ChangeSet(order = "006", id = "delete-orphan-pages", author = "")
    public void deleteOrphanPages(MongockTemplate mongockTemplate) {

        final Query validPagesQuery = query(where(fieldName(QApplication.application.deleted)).ne(true));
        validPagesQuery.fields().include(fieldName(QApplication.application.pages));
        validPagesQuery.fields().include(fieldName(QApplication.application.publishedPages));

        final List<Application> applications = mongockTemplate.find(validPagesQuery, Application.class);

        final Update deletionUpdates = new Update();
        deletionUpdates.set(fieldName(QNewPage.newPage.deleted), true);
        deletionUpdates.set(fieldName(QNewPage.newPage.deletedAt), Instant.now());

        // Archive the pages which have the applicationId but the connection is missing from the application object.
        for (Application application : applications) {
            Set<String> validPageIds = new HashSet<>();
            if (!CollectionUtils.isEmpty(application.getPages())) {
                for (ApplicationPage applicationPage : application.getPages()) {
                    validPageIds.add(applicationPage.getId());
                }
            }
            if (!CollectionUtils.isEmpty(application.getPublishedPages())) {
                for (ApplicationPage applicationPublishedPage : application.getPublishedPages()) {
                    validPageIds.add(applicationPublishedPage.getId());
                }
            }
            final Query pageQuery = query(where(fieldName(QNewPage.newPage.deleted)).ne(true));
            pageQuery.addCriteria(where(fieldName(QNewPage.newPage.applicationId)).is(application.getId()));
            pageQuery.fields().include(fieldName(QNewPage.newPage.applicationId));

            final List<NewPage> pages = mongockTemplate.find(pageQuery, NewPage.class);
            for (NewPage newPage : pages) {
                if (!validPageIds.contains(newPage.getId())) {
                    mongockTemplate.updateFirst(
                            query(where(fieldName(QNewPage.newPage.id)).is(newPage.getId())),
                            deletionUpdates,
                            NewPage.class
                    );
                }
            }
        }
    }

    /**
     * This migration introduces indexes on newAction, actionCollection, newPage to improve the query performance for
     * queries like getResourceByDefaultAppIdAndGitSyncId which excludes the deleted entries.
     */
    @ChangeSet(order = "007", id = "update-git-indexes", author = "")
    public void addIndexesForGit(MongockTemplate mongockTemplate) {

        dropIndexIfExists(mongockTemplate, NewAction.class, "defaultApplicationId_gitSyncId_compound_index");
        dropIndexIfExists(mongockTemplate, ActionCollection.class, "defaultApplicationId_gitSyncId_compound_index");

        String defaultResources = fieldName(QBaseDomain.baseDomain.defaultResources);
        ensureIndexes(mongockTemplate, ActionCollection.class,
                makeIndex(
                        defaultResources + "." + FieldName.APPLICATION_ID,
                        fieldName(QBaseDomain.baseDomain.gitSyncId),
                        fieldName(QBaseDomain.baseDomain.deleted)
                )
                        .named("defaultApplicationId_gitSyncId_deleted_compound_index")
        );

        ensureIndexes(mongockTemplate, NewAction.class,
                makeIndex(
                        defaultResources + "." + FieldName.APPLICATION_ID,
                        fieldName(QBaseDomain.baseDomain.gitSyncId),
                        fieldName(QBaseDomain.baseDomain.deleted)
                )
                        .named("defaultApplicationId_gitSyncId_deleted_compound_index")
        );

        ensureIndexes(mongockTemplate, NewPage.class,
                makeIndex(
                        defaultResources + "." + FieldName.APPLICATION_ID,
                        fieldName(QBaseDomain.baseDomain.gitSyncId),
                        fieldName(QBaseDomain.baseDomain.deleted)
                )
                        .named("defaultApplicationId_gitSyncId_deleted_compound_index")
        );
    }


    /**
     * We'll remove the unique index on organization slugs. We'll also regenerate the slugs for all organizations as
     * most of them are outdated
     *
     * @param mongockTemplate MongockTemplate instance
     */
    @ChangeSet(order = "008", id = "update-organization-slugs", author = "")
    public void updateOrganizationSlugs(MongockTemplate mongockTemplate) {
        dropIndexIfExists(mongockTemplate, Organization.class, "slug");

        // update organizations
        final Query getAllOrganizationsQuery = query(where("deletedAt").is(null));
        getAllOrganizationsQuery.fields()
                .include(fieldName(QOrganization.organization.name));

        List<Organization> organizations = mongockTemplate.find(getAllOrganizationsQuery, Organization.class);

        for (Organization organization : organizations) {
            mongockTemplate.updateFirst(
                    query(where(fieldName(QOrganization.organization.id)).is(organization.getId())),
                    new Update().set(fieldName(QOrganization.organization.slug), TextUtils.makeSlug(organization.getName())),
                    Organization.class
            );
        }
    }

    @ChangeSet(order = "009", id = "copy-organization-to-workspaces", author = "")
    public void copyOrganizationToWorkspaces(MongockTemplate mongockTemplate) {
        // Drop the workspace collection in case it has been partially run, otherwise it has no effect
        mongockTemplate.dropCollection(Workspace.class);
        Gson gson = new Gson();
        //Memory optimization note:
        //Call stream instead of findAll to avoid out of memory if the collection is big
        //stream implementation lazy loads the data using underlying cursor open on the collection
        //the data is loaded as and when needed by the pipeline
        try (Stream<Organization> stream = mongockTemplate.stream(new Query().cursorBatchSize(10000), Organization.class)
                .stream()) {
            stream.forEach((organization) -> {
                Workspace workspace = gson.fromJson(gson.toJson(organization), Workspace.class);
                mongockTemplate.insert(workspace);
            });
        }
    }

    /**
     * We are creating indexes manually because Spring's index resolver creates indexes on fields as well.
     * See https://stackoverflow.com/questions/60867491/ for an explanation of the problem. We have that problem with
     * the `Action.datasource` field.
     */
    @ChangeSet(order = "010", id = "add-workspace-indexes", author = "")
    public void addWorkspaceIndexes(MongockTemplate mongockTemplate) {
        ensureIndexes(mongockTemplate, Workspace.class,
                makeIndex("createdAt")
        );
    }

    @ChangeSet(order = "011", id = "update-sequence-names-from-organization-to-workspace", author = "")
    public void updateSequenceNamesFromOrganizationToWorkspace(MongockTemplate mongockTemplate) {
        for (Sequence sequence : mongockTemplate.findAll(Sequence.class)) {
            String oldName = sequence.getName();
            String newName = oldName.replaceAll("(.*) for organization with _id : (.*)", "$1 for workspace with _id : $2");
            if (!newName.equals(oldName)) {
                //Using strings in the field names instead of QSequence becauce Sequence is not a AppsmithDomain
                mongockTemplate.updateFirst(query(where("name").is(oldName)),
                        Update.update("name", newName),
                        Sequence.class
                );
            }
        }
    }

    @ChangeSet(order = "012", id = "add-default-tenant", author = "")
    public void addDefaultTenant(MongockTemplate mongockTemplate) {

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant tenant = mongockTemplate.findOne(tenantQuery, Tenant.class);

        // if tenant already exists, don't create a new one.
        if (tenant != null) {
            return;
        }

        Tenant defaultTenant = new Tenant();
        defaultTenant.setDisplayName("Default");
        defaultTenant.setSlug("default");
        defaultTenant.setPricingPlan(PricingPlan.FREE);

        mongockTemplate.save(defaultTenant);

    }

    @ChangeSet(order = "013", id = "add-tenant-to-all-workspaces", author = "")
    public void addTenantToWorkspaces(MongockTemplate mongockTemplate) {

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant defaultTenant = mongockTemplate.findOne(tenantQuery, Tenant.class);
        assert (defaultTenant != null);

        // Set all the workspaces to be under the default tenant
        mongockTemplate.updateMulti(
                new Query(),
                new Update().set("tenantId", defaultTenant.getId()),
                Workspace.class
        );

    }

    @ChangeSet(order = "014", id = "add-tenant-to-all-users-and-flush-redis", author = "")
    public void addTenantToUsersAndFlushRedis(MongockTemplate mongockTemplate, ReactiveRedisOperations<String, String> reactiveRedisOperations) {

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant defaultTenant = mongockTemplate.findOne(tenantQuery, Tenant.class);
        assert (defaultTenant != null);

        // Set all the users to be under the default tenant
        mongockTemplate.updateMulti(
                new Query(),
                new Update().set("tenantId", defaultTenant.getId()),
                User.class
        );

        // Now sign out all the existing users since this change impacts the user object.
        final String script =
                "for _,k in ipairs(redis.call('keys','spring:session:sessions:*'))" +
                        " do redis.call('del',k) " +
                        "end";
        final Flux<Object> flushdb = reactiveRedisOperations.execute(RedisScript.of(script));

        flushdb.subscribe();
    }

    @ChangeSet(order = "015", id = "migrate-organizationId-to-workspaceId-in-domain-objects", author = "")
    public void migrateOrganizationIdToWorkspaceIdInDomainObjects(MongockTemplate mongockTemplate, ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QDatasource.datasource.workspaceId)).toValueOf(Fields.field(fieldName(QDatasource.datasource.organizationId))),
                Datasource.class);
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QActionCollection.actionCollection.workspaceId)).toValueOf(Fields.field(fieldName(QActionCollection.actionCollection.organizationId))),
                ActionCollection.class);
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QApplication.application.workspaceId)).toValueOf(Fields.field(fieldName(QApplication.application.organizationId))),
                Application.class);
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QNewAction.newAction.workspaceId)).toValueOf(Fields.field(fieldName(QNewAction.newAction.organizationId))),
                NewAction.class);
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QTheme.theme.workspaceId)).toValueOf(Fields.field(fieldName(QTheme.theme.organizationId))),
                Theme.class);
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QUserData.userData.recentlyUsedWorkspaceIds)).toValueOf(Fields.field(fieldName(QUserData.userData.recentlyUsedOrgIds))),
                UserData.class);
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QWorkspace.workspace.isAutoGeneratedWorkspace)).toValueOf(Fields.field(fieldName(QWorkspace.workspace.isAutoGeneratedOrganization))),
                Workspace.class);
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update()
                        .set(fieldName(QUser.user.workspaceIds)).toValueOf(Fields.field(fieldName(QUser.user.organizationIds)))
                        .set(fieldName(QUser.user.currentWorkspaceId)).toValueOf(Fields.field(fieldName(QUser.user.currentOrganizationId)))
                        .set(fieldName(QUser.user.examplesWorkspaceId)).toValueOf(Fields.field(fieldName(QUser.user.examplesOrganizationId))),
                User.class);

        // Now sign out all the existing users since this change impacts the user object.
        final String script =
                "for _,k in ipairs(redis.call('keys','spring:session:sessions:*'))" +
                        " do redis.call('del',k) " +
                        "end";
        final Flux<Object> flushdb = reactiveRedisOperations.execute(RedisScript.of(script));

        flushdb.subscribe();

        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QComment.comment.workspaceId)).toValueOf(Fields.field(fieldName(QComment.comment.workspaceId))),
                Comment.class);
        mongockTemplate.updateMulti(new Query(),
                AggregationUpdate.update().set(fieldName(QCommentThread.commentThread.workspaceId)).toValueOf(Fields.field(fieldName(QCommentThread.commentThread.workspaceId))),
                CommentThread.class);
    }

    @ChangeSet(order = "016", id = "organization-to-workspace-indexes-recreate", author = "")
    public void organizationToWorkspaceIndexesRecreate(MongockTemplate mongockTemplate) {
        dropIndexIfExists(mongockTemplate, Application.class, "organization_application_deleted_gitApplicationMetadata_compound_index");
        dropIndexIfExists(mongockTemplate, Datasource.class, "organization_datasource_deleted_compound_index");

        //If this migration is re-run
        dropIndexIfExists(mongockTemplate, Application.class, "workspace_application_deleted_gitApplicationMetadata_compound_index");
        dropIndexIfExists(mongockTemplate, Datasource.class, "workspace_datasource_deleted_compound_index");

        ensureIndexes(mongockTemplate, Application.class,
                makeIndex(
                        fieldName(QApplication.application.workspaceId),
                        fieldName(QApplication.application.name),
                        fieldName(QApplication.application.deletedAt),
                        "gitApplicationMetadata.remoteUrl",
                        "gitApplicationMetadata.branchName")
                        .unique().named("workspace_application_deleted_gitApplicationMetadata_compound_index")
        );
        ensureIndexes(mongockTemplate, Datasource.class,
                makeIndex(fieldName(QDatasource.datasource.workspaceId),
                        fieldName(QDatasource.datasource.name),
                        fieldName(QDatasource.datasource.deletedAt))
                        .unique().named("workspace_datasource_deleted_compound_index")
        );
    }

    @ChangeSet(order = "017", id = "migrate-permission-in-user", author = "")
    public void migratePermissionsInUser(MongockTemplate mongockTemplate) {
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("manage:userOrganization")),
                new Update().set("policies.$.permission", "manage:userWorkspace"),
                User.class);
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("read:userOrganization")),
                new Update().set("policies.$.permission", "read:userWorkspace"),
                User.class);
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("read:userOrganization")),
                new Update().set("policies.$.permission", "read:userWorkspace"),
                User.class);
    }

    @ChangeSet(order = "018", id = "migrate-permission-in-workspace", author = "")
    public void migratePermissionsInWorkspace(MongockTemplate mongockTemplate) {
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("manage:organizations")),
                new Update().set("policies.$.permission", "manage:workspaces"),
                Workspace.class);
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("read:organizations")),
                new Update().set("policies.$.permission", "read:workspaces"),
                Workspace.class);
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("manage:orgApplications")),
                new Update().set("policies.$.permission", "manage:workspaceApplications"),
                Workspace.class);
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("read:orgApplications")),
                new Update().set("policies.$.permission", "read:workspaceApplications"),
                Workspace.class);
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("publish:orgApplications")),
                new Update().set("policies.$.permission", "publish:workspaceApplications"),
                Workspace.class);
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("export:orgApplications")),
                new Update().set("policies.$.permission", "export:workspaceApplications"),
                Workspace.class);
        mongockTemplate.updateMulti(
                new Query().addCriteria(where("policies.permission").is("inviteUsers:organization")),
                new Update().set("policies.$.permission", "inviteUsers:workspace"),
                Workspace.class);
    }

    @ChangeSet(order = "019", id = "migrate-organizationId-to-workspaceId-in-newaction-datasource", author = "")
    public void migrateOrganizationIdToWorkspaceIdInNewActionDatasource(MongockTemplate mongockTemplate, ReactiveRedisOperations<String, String> reactiveRedisOperations) {
        mongockTemplate.updateMulti(new Query(Criteria.where("unpublishedAction.datasource.organizationId").exists(true)),
                AggregationUpdate.update().set("unpublishedAction.datasource.workspaceId").toValueOf(Fields.field("unpublishedAction.datasource.organizationId")),
                NewAction.class);
        mongockTemplate.updateMulti(new Query(Criteria.where("publishedAction.datasource.organizationId").exists(true)),
                AggregationUpdate.update().set("publishedAction.datasource.workspaceId").toValueOf(Fields.field("publishedAction.datasource.organizationId")),
                NewAction.class);
    }

    @ChangeSet(order = "020", id = "migrate-google-sheets-to-uqi", author = "")
    public void migrateGoogleSheetsToUqi(MongockTemplate mongockTemplate) {

        // Get plugin references to Google Sheets actions
        Plugin uqiPlugin = mongockTemplate.findOne(
                query(where("packageName").in("google-sheets-plugin")),
                Plugin.class
        );
        assert uqiPlugin != null;
        uqiPlugin.setUiComponent("UQIDbEditorForm");

        mongockTemplate.save(uqiPlugin);

        final String pluginId = uqiPlugin.getId();

        // Find all relevant actions
        final Query actionQuery = query(
                where(fieldName(QNewAction.newAction.pluginId)).is(pluginId)
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

            try {
                migrateGoogleSheetsToUqi(uqiAction);
            } catch (AppsmithException e) {
                // This action is already migrated, move on
                log.error("Failed with error: {}", e.getMessage());
                log.error("Failing action: {}", uqiAction.getId());
                continue;
            }
            mongockTemplate.save(uqiAction);
        }
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
                Map.entry(14, List.of("where.data"))

        );

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
        List<Property> newDynamicBindingPathList = getUpdatedDynamicBindingPathList(dynamicBindingPathList,
                objectMapper, uqiAction, googleSheetsMigrationMap);
        unpublishedAction.setDynamicBindingPathList(newDynamicBindingPathList);
    }

    private static void mapGoogleSheetsToNewFormData(ActionDTO action, Map<String, Object> f) {
        final Map<String, Object> formData = action.getActionConfiguration().getFormData();

        if (formData != null) {
            // This action has already been migrated
            throw new AppsmithException(AppsmithError.MIGRATION_ERROR);
        }

        final List<Property> pluginSpecifiedTemplates = action.getActionConfiguration().getPluginSpecifiedTemplates();

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
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(14)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(14).getValue())) {
                    convertToFormDataObject(f, "where", updateWhereClauseFormat(pluginSpecifiedTemplates.get(14).getValue()));
                }
            case 14:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(13)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(13).getValue())) {
                    convertToFormDataObject(f, "smartSubstitution", pluginSpecifiedTemplates.get(13).getValue());
                }
            case 13:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(12)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(12).getValue()) && "DELETE".equals(oldCommand)) {
                    convertToFormDataObject(f, "entityType", pluginSpecifiedTemplates.get(12).getValue());
                }
            case 12:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(11)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(11).getValue())) {
                    convertToFormDataObject(f, "rowIndex", pluginSpecifiedTemplates.get(11).getValue());
                }
            case 11:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(10)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(10).getValue())) {
                    if (List.of("BULK_APPEND", "BULK_UPDATE", "CREATE").contains(oldCommand)) {
                        convertToFormDataObject(f, "rowObjects", pluginSpecifiedTemplates.get(10).getValue());
                    }
                }
            case 10:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(9)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(9).getValue())) {
                    if (List.of("APPEND", "UPDATE").contains(oldCommand)) {
                        convertToFormDataObject(f, "rowObjects", pluginSpecifiedTemplates.get(9).getValue());
                    }
                }
            case 9:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(8)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(8).getValue())) {
                    if (!f.containsKey("pagination")) {
                        final HashMap<String, Object> map = new HashMap<>();
                        map.put("offset", pluginSpecifiedTemplates.get(8).getValue());
                        convertToFormDataObject(f, "pagination", map);
                    } else {
                        final Map<String, Object> pagination = (Map<String, Object>) f.get("pagination");
                        final Map<String, Object> data = (Map<String, Object>) pagination.get("data");
                        final Map<String, Object> componentData = (Map<String, Object>) pagination.get("componentData");
                        data.put("offset", pluginSpecifiedTemplates.get(8).getValue());
                        componentData.put("offset", pluginSpecifiedTemplates.get(8).getValue());
                    }
                }
            case 8:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(7)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(7).getValue())) {
                    // Sheet name will now have a dropdown component that is selected from a pre-populated list.
                    // Bindings would need to be placed in the JS mode
                    boolean hasBinding = false;
                    if (action.getDynamicBindingPathList() != null) {
                        hasBinding = action.getDynamicBindingPathList().stream().anyMatch(dynamicBindingPath -> {
                            return dynamicBindingPath.getKey().contains("pluginSpecifiedTemplates[7]");
                        });
                    }
                    convertToFormDataObject(f, "sheetName", pluginSpecifiedTemplates.get(7).getValue(), hasBinding);
                }
            case 7:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(6)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(6).getValue())) {
                    if (!f.containsKey("pagination")) {
                        final HashMap<String, Object> map = new HashMap<>();
                        map.put("limit", pluginSpecifiedTemplates.get(6).getValue());
                        convertToFormDataObject(f, "pagination", map);
                    } else {
                        final Map<String, Object> pagination = (Map<String, Object>) f.get("pagination");
                        final Map<String, Object> data = (Map<String, Object>) pagination.get("data");
                        final Map<String, Object> componentData = (Map<String, Object>) pagination.get("componentData");
                        data.put("limit", pluginSpecifiedTemplates.get(6).getValue());
                        componentData.put("limit", pluginSpecifiedTemplates.get(6).getValue());
                    }
                }
            case 6:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(5)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(5).getValue())) {
                    convertToFormDataObject(f, "queryFormat", pluginSpecifiedTemplates.get(5).getValue());
                }
            case 5:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(4)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(4).getValue())) {
                    convertToFormDataObject(f, "tableHeaderIndex", pluginSpecifiedTemplates.get(4).getValue());
                }
            case 4:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(3)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(3).getValue())) {
                    convertToFormDataObject(f, "spreadsheetName", pluginSpecifiedTemplates.get(3).getValue());
                }
            case 3:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(2)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(2).getValue())) {
                    convertToFormDataObject(f, "range", pluginSpecifiedTemplates.get(2).getValue());
                }
            case 2:
                if (!ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(1)) && !ObjectUtils.isEmpty(pluginSpecifiedTemplates.get(1).getValue())) {
                    // Sheet URL will now have a dropdown component that is selected from a pre-populated list.
                    // Bindings would need to be placed in the JS mode
                    boolean hasBinding = false;
                    if (action.getDynamicBindingPathList() != null) {
                        hasBinding = action.getDynamicBindingPathList().stream().anyMatch(dynamicBindingPath -> {
                            return dynamicBindingPath.getKey().contains("pluginSpecifiedTemplates[1]");
                        });
                    }
                    final String spreadsheetUrl = (String) pluginSpecifiedTemplates.get(1).getValue();
                    final Matcher matcher = sheetRangePattern.matcher(spreadsheetUrl);

                    if (matcher.find()) {
                        final String newSpreadsheetUrl = matcher.replaceAll("https://docs.google.com/spreadsheets/d/" + matcher.group(1) + "/edit");
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
            ((ArrayList) oldWhereClauseArray)
                    .stream()
                    .forEach(oldWhereClauseCondition -> {
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
        DatabaseChangelog.doClearRedisKeys(reactiveRedisOperations);
    }

    private List<String> getCustomizedThemeIds(String fieldName, Function<Application, String> getThemeIdMethod, List<String> systemThemeIds, MongockTemplate mongockTemplate) {
        // query to get application having a customized theme in the provided fieldName
        Query getAppsWithCustomTheme = new Query(
                Criteria.where(fieldName(QApplication.application.gitApplicationMetadata)).exists(true)
                        .and(fieldName(QApplication.application.deleted)).is(false)
                        .andOperator(
                                where(fieldName).nin(systemThemeIds), where(fieldName).exists(true)
                        )
        );

        // we need the provided field "fieldName" only
        getAppsWithCustomTheme.fields().include(fieldName);

        List<Application> applications = mongockTemplate.find(getAppsWithCustomTheme, Application.class);
        return applications.stream().map(getThemeIdMethod).collect(Collectors.toList());
    }

    @ChangeSet(order = "022", id = "fix-deleted-themes-when-git-branch-deleted", author = "")
    public void fixDeletedThemesWhenGitBranchDeleted(MongockTemplate mongockTemplate) {
        Query getSystemThemesQuery = new Query(Criteria.where(fieldName(QTheme.theme.isSystemTheme)).is(TRUE));
        getSystemThemesQuery.fields().include(fieldName(QTheme.theme.id));
        List<Theme> systemThemes = mongockTemplate.find(getSystemThemesQuery, Theme.class);
        List<String> systemThemeIds = systemThemes.stream().map(BaseDomain::getId).collect(Collectors.toList());

        List<String> customizedEditModeThemeIds = getCustomizedThemeIds(
                fieldName(QApplication.application.editModeThemeId), Application::getEditModeThemeId, systemThemeIds, mongockTemplate
        );

        List<String> customizedPublishedModeThemeIds = getCustomizedThemeIds(
                fieldName(QApplication.application.publishedModeThemeId), Application::getPublishedModeThemeId, systemThemeIds, mongockTemplate
        );

        // combine the theme ids
        Set<String> set = new HashSet<>();
        set.addAll(customizedEditModeThemeIds);
        set.addAll(customizedPublishedModeThemeIds);

        Update update = new Update().set(fieldName(QTheme.theme.deleted), false)
                .unset(fieldName(QTheme.theme.deletedAt));
        Criteria deletedCustomThemes = Criteria.where(fieldName(QTheme.theme.id)).in(set)
                .and(fieldName(QTheme.theme.deleted)).is(true);

        mongockTemplate.updateMulti(new Query(deletedCustomThemes), update, Theme.class);

        for (String editModeThemeId : customizedEditModeThemeIds) {
            Query query = new Query(Criteria.where(fieldName(QApplication.application.editModeThemeId)).is(editModeThemeId))
                    .addCriteria(where(fieldName(QApplication.application.deleted)).is(false))
                    .addCriteria(where(fieldName(QApplication.application.gitApplicationMetadata)).exists(true));
            query.fields().include(fieldName(QApplication.application.id));

            List<Application> applicationList = mongockTemplate.find(query, Application.class);
            if (applicationList.size() > 1) { // same custom theme is set to more than one application
                // Remove one as we will create a  new theme for all the other branch apps
                applicationList.remove(applicationList.size() - 1);

                // clone the custom theme for each of these applications
                Query themeQuery = new Query(Criteria.where(fieldName(QTheme.theme.id)).is(editModeThemeId))
                        .addCriteria(where(fieldName(QTheme.theme.deleted)).is(false));
                Theme theme = mongockTemplate.findOne(themeQuery, Theme.class);
                for (Application application : applicationList) {
                    Theme newTheme = new Theme();
                    copyNestedNonNullProperties(theme, newTheme);
                    newTheme.setId(null);
                    newTheme.setSystemTheme(false);
                    newTheme = mongockTemplate.insert(newTheme);
                    mongockTemplate.updateFirst(
                            new Query(Criteria.where(fieldName(QApplication.application.id)).is(application.getId())),
                            new Update().set(fieldName(QApplication.application.editModeThemeId), newTheme.getId()),
                            Application.class
                    );
                }
            }
        }
    }

    @ChangeSet(order = "023", id = "add-anonymousUser", author = "")
    public void addAnonymousUser(MongockTemplate mongockTemplate) {
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant tenant = mongockTemplate.findOne(tenantQuery, Tenant.class);

        Query userQuery = new Query();
        userQuery.addCriteria(where(fieldName(QUser.user.email)).is(FieldName.ANONYMOUS_USER))
                .addCriteria(where(fieldName(QUser.user.tenantId)).is(tenant.getId()));
        User anonymousUser = mongockTemplate.findOne(userQuery, User.class);

        if (anonymousUser == null) {
            anonymousUser = new User();
            anonymousUser.setName(FieldName.ANONYMOUS_USER);
            anonymousUser.setEmail(FieldName.ANONYMOUS_USER);
            anonymousUser.setCurrentWorkspaceId("");
            anonymousUser.setWorkspaceIds(new HashSet<>());
            anonymousUser.setIsAnonymous(true);
            anonymousUser.setTenantId(tenant.getId());

            mongockTemplate.save(anonymousUser);
        }
    }

    private String getDefaultNameForGroupInWorkspace(String prefix, String workspaceName) {
        return prefix + " - " + workspaceName;
    }

    private Set<PermissionGroup> generateDefaultPermissionGroupsWithoutPermissions(MongockTemplate mongockTemplate, Workspace workspace) {
        String workspaceName = workspace.getName();
        String workspaceId = workspace.getId();
        Set<Permission> permissions = new HashSet<>();
        // Administrator permission group
        PermissionGroup adminPermissionGroup = new PermissionGroup();
        adminPermissionGroup.setName(getDefaultNameForGroupInWorkspace(FieldName.ADMINISTRATOR, workspaceName));
        adminPermissionGroup.setDefaultWorkspaceId(workspaceId);
        adminPermissionGroup.setTenantId(workspace.getTenantId());
        adminPermissionGroup.setDescription(FieldName.WORKSPACE_ADMINISTRATOR_DESCRIPTION);
        adminPermissionGroup = mongockTemplate.save(adminPermissionGroup);
        // This ensures that a user can leave a permission group
        permissions = Set.of(new Permission(adminPermissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS));
        adminPermissionGroup.setPermissions(permissions);
        adminPermissionGroup = mongockTemplate.save(adminPermissionGroup);

        // Developer permission group
        PermissionGroup developerPermissionGroup = new PermissionGroup();
        developerPermissionGroup.setName(getDefaultNameForGroupInWorkspace(FieldName.DEVELOPER, workspaceName));
        developerPermissionGroup.setDefaultWorkspaceId(workspaceId);
        developerPermissionGroup.setTenantId(workspace.getTenantId());
        developerPermissionGroup.setDescription(FieldName.WORKSPACE_DEVELOPER_DESCRIPTION);
        developerPermissionGroup = mongockTemplate.save(developerPermissionGroup);
        // This ensures that a user can leave a permission group
        permissions = Set.of(new Permission(developerPermissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS));
        developerPermissionGroup.setPermissions(permissions);
        developerPermissionGroup = mongockTemplate.save(developerPermissionGroup);

        // App viewer permission group
        PermissionGroup viewerPermissionGroup = new PermissionGroup();
        viewerPermissionGroup.setName(getDefaultNameForGroupInWorkspace(FieldName.VIEWER, workspaceName));
        viewerPermissionGroup.setDefaultWorkspaceId(workspaceId);
        viewerPermissionGroup.setTenantId(workspace.getTenantId());
        viewerPermissionGroup.setDescription(FieldName.WORKSPACE_VIEWER_DESCRIPTION);
        viewerPermissionGroup = mongockTemplate.save(viewerPermissionGroup);
        // This ensures that a user can leave a permission group
        permissions = Set.of(new Permission(viewerPermissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS));
        viewerPermissionGroup.setPermissions(permissions);
        viewerPermissionGroup = mongockTemplate.save(viewerPermissionGroup);

        return Set.of(adminPermissionGroup, developerPermissionGroup, viewerPermissionGroup);
    }

    private Set<PermissionGroup> generatePermissionsForDefaultPermissionGroups(MongockTemplate mongockTemplate, PolicyUtils policyUtils, Set<PermissionGroup> permissionGroups, Workspace workspace, Map<String, String> userIdForEmail, Set<String> validUserIds) {
        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.ADMINISTRATOR))
                .findFirst().get();
        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.DEVELOPER))
                .findFirst().get();
        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(FieldName.VIEWER))
                .findFirst().get();

        // Administrator permissions
        Set<Permission> workspacePermissions = AppsmithRole.ORGANIZATION_ADMIN
                .getPermissions()
                .stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        Set<Permission> readPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.READ_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        Set<Permission> unassignPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        Set<Permission> assignPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());

        List<UserRole> userRoles = workspace.getUserRoles()
                .stream()
                .map(userRole -> {
                    // If userId is not valid populate it with the userId mapped to the email
                    // This happens if user is deleted manually from database and re-added again
                    if (!validUserIds.contains(userRole.getUserId())) {
                        if (userIdForEmail.containsKey(userRole.getUsername())) {
                            userRole.setUserId(userIdForEmail.get(userRole.getUsername()));
                        } else {
                            // Set userId to null if even email is not found
                            userRole.setUserId(null);
                        }
                    }
                    return userRole;
                })
                //filter out the users who are still not valid
                .filter(userRole -> userRole.getUserId() != null)
                //collect the user roles into a list
                .collect(Collectors.toList());

        Set<Permission> permissions = new HashSet<>(adminPermissionGroup.getPermissions());
        permissions.addAll(workspacePermissions);
        permissions.addAll(readPermissionGroupPermissions);
        permissions.addAll(unassignPermissionGroupPermissions);
        permissions.addAll(assignPermissionGroupPermissions);
        adminPermissionGroup.setPermissions(permissions);

        // Assign admin user ids to the administrator permission group
        Set<String> adminUserIds = userRoles
                .stream()
                .filter(userRole -> userRole.getRole().equals(AppsmithRole.ORGANIZATION_ADMIN))
                .map(UserRole::getUserId)
                .collect(Collectors.toSet());

        adminPermissionGroup.setAssignedToUserIds(adminUserIds);

        // Developer Permissions
        workspacePermissions = AppsmithRole.ORGANIZATION_DEVELOPER
                .getPermissions()
                .stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        // The developer should also be able to assign developer & viewer permission groups
        assignPermissionGroupPermissions = Set.of(developerPermissionGroup, viewerPermissionGroup).stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        permissions = new HashSet<>(developerPermissionGroup.getPermissions());
        permissions.addAll(workspacePermissions);
        permissions.addAll(assignPermissionGroupPermissions);
        permissions.addAll(readPermissionGroupPermissions);
        developerPermissionGroup.setPermissions(permissions);

        // Assign developer user ids to the developer permission group
        Set<String> developerUserIds = userRoles
                .stream()
                .filter(userRole -> userRole.getRole().equals(AppsmithRole.ORGANIZATION_DEVELOPER))
                .map(UserRole::getUserId)
                .collect(Collectors.toSet());

        developerPermissionGroup.setAssignedToUserIds(developerUserIds);

        // App Viewer Permissions
        workspacePermissions = AppsmithRole.ORGANIZATION_VIEWER
                .getPermissions()
                .stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        // The app viewers should also be able to assign to viewer permission groups
        assignPermissionGroupPermissions = Set.of(viewerPermissionGroup).stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        permissions = new HashSet<>(viewerPermissionGroup.getPermissions());
        permissions.addAll(workspacePermissions);
        permissions.addAll(assignPermissionGroupPermissions);
        permissions.addAll(readPermissionGroupPermissions);
        viewerPermissionGroup.setPermissions(permissions);

        // Assign viewer user ids to the viewer permission group
        Set<String> viewerUserIds = userRoles
                .stream()
                .filter(userRole -> userRole.getRole().equals(AppsmithRole.ORGANIZATION_VIEWER))
                .map(UserRole::getUserId)
                .collect(Collectors.toSet());

        viewerPermissionGroup.setAssignedToUserIds(viewerUserIds);

        Set<PermissionGroup> savedPermissionGroups = Set.of(adminPermissionGroup, developerPermissionGroup, viewerPermissionGroup);

        // Apply the permissions to the permission groups
        for (PermissionGroup permissionGroup : savedPermissionGroups) {
            for (PermissionGroup nestedPermissionGroup : savedPermissionGroups) {
                Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermissionGroupForObject(permissionGroup, nestedPermissionGroup.getId());
                policyUtils.addPoliciesToExistingObject(policyMap, nestedPermissionGroup);
            }
        }

        // Save the permission groups
        adminPermissionGroup = mongockTemplate.save(adminPermissionGroup);
        developerPermissionGroup = mongockTemplate.save(developerPermissionGroup);
        viewerPermissionGroup = mongockTemplate.save(viewerPermissionGroup);

        return Set.of(adminPermissionGroup, developerPermissionGroup, viewerPermissionGroup);
    }

    private void rollbackAddDefaultPermissionGroups(MongockTemplate mongockTemplate, Workspace workspace) {
        // Delete the permission groups
        mongockTemplate.remove(PermissionGroup.class)
                .matching(new Query(Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)).is(workspace.getId())))
                .all();
    }

    @ChangeSet(order = "024", id = "add-default-permission-groups", author = "")
    public void addDefaultPermissionGroups(MongockTemplate mongockTemplate, WorkspaceService workspaceService, @NonLockGuarded PolicyUtils policyUtils, UserRepository userRepository) {

        // Create a map of emails to userIds
        Map<String, String> userIdForEmail = mongockTemplate.stream(new Query(), User.class)
                .stream()
                .collect(Collectors.toMap(User::getEmail, User::getId, (value1, value2) -> value1, HashMap::new));

        // Create a set of valid userIds
        Set<String> validUserIds = userIdForEmail.values().stream().collect(Collectors.toCollection(HashSet::new));

        // Rollback permission groups created on locked workspaces
        mongockTemplate.stream(new Query(Criteria.where("locked").is(true)), Workspace.class)
                .stream()
                .forEach(workspace -> {
                    rollbackAddDefaultPermissionGroups(mongockTemplate, workspace);
                    // unlock the workspace
                    mongockTemplate.update(Workspace.class)
                            .matching(new Criteria("_id").is(new ObjectId(workspace.getId())))
                            .apply(new Update().unset("locked"))
                            .first();
                });

        // Stream workspaces which does not have default permission groups
        mongockTemplate.stream(new Query(Criteria.where(fieldName(QWorkspace.workspace.defaultPermissionGroups)).is(null)), Workspace.class)
                .stream()
                .forEach(workspace -> {
                    if (workspace.getUserRoles() != null) {

                        //lock the workspace
                        mongockTemplate.update(Workspace.class)
                                .matching(new Criteria("_id").is(new ObjectId(workspace.getId())))
                                .apply(new Update().set("locked", true))
                                .first();

                        // Clear permission groups inside policies
                        // This ensures that migration can run again if aborted in between
                        workspace.getPolicies().forEach(policy -> {
                            policy.setPermissionGroups(new HashSet<>());
                        });
                        Set<PermissionGroup> permissionGroups = generateDefaultPermissionGroupsWithoutPermissions(mongockTemplate, workspace);
                        // Set default permission groups
                        workspace.setDefaultPermissionGroups(permissionGroups.stream().map(PermissionGroup::getId).collect(Collectors.toSet()));
                        // Generate permissions and policies for the default permission groups
                        permissionGroups = generatePermissionsForDefaultPermissionGroups(mongockTemplate, policyUtils, permissionGroups, workspace, userIdForEmail, validUserIds);
                        // Apply the permissions to the workspace
                        for (PermissionGroup permissionGroup : permissionGroups) {
                            // Apply the permissions to the workspace
                            Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermissionGroupForObject(permissionGroup, workspace.getId());
                            workspace = policyUtils.addPoliciesToExistingObject(policyMap, workspace);
                        }
                        // Save the workspace
                        mongockTemplate.save(workspace);

                        // unlock the workspace
                        mongockTemplate.update(Workspace.class)
                                .matching(new Criteria("_id").is(new ObjectId(workspace.getId())))
                                .apply(new Update().unset("locked"))
                                .first();
                    }
                });
    }

    @ChangeSet(order = "025", id = "mark-public-apps", author = "")
    public void markPublicApps(MongockTemplate mongockTemplate) {
        //Temporarily mark public applications
        mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where("policies").elemMatch(Criteria.where("permission").is(AclPermission.READ_APPLICATIONS.getValue()).and("users").is("anonymousUser"))),
                new Update().set("makePublic", true),
                Application.class);
    }

    @ChangeSet(order = "026", id = "mark-workspaces-for-inheritance", author = "")
    public void markWorkspacesForInheritance(MongockTemplate mongockTemplate) {
        //Temporarily mark all workspaces for processing of permissions inheritance
        mongockTemplate.updateMulti(new Query(),
                new Update().set("inheritPermissions", true),
                Workspace.class);
    }

    @ChangeSet(order = "027", id = "inherit-policies-to-every-child-object", author = "")
    public void inheritPoliciesToEveryChildObject(MongockTemplate mongockTemplate, @NonLockGuarded PolicyGenerator policyGenerator) {

        mongockTemplate.stream(new Query(Criteria.where("inheritPermissions").is(true)), Workspace.class)
                .stream()
                .forEach(workspace -> {
                    // Process applications
                    Set<Policy> applicationPolicies = policyGenerator.getAllChildPolicies(workspace.getPolicies(), Workspace.class, Application.class);
                    mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QApplication.application.workspaceId)).is(workspace.getId())),
                            new Update().set("policies", applicationPolicies),
                            Application.class);

                    // Process datasources
                    Set<Policy> datasourcePolicies = policyGenerator.getAllChildPolicies(workspace.getPolicies(), Workspace.class, Datasource.class);
                    mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QDatasource.datasource.workspaceId)).is(workspace.getId())),
                            new Update().set("policies", datasourcePolicies),
                            Datasource.class);

                    // Get application ids
                    Set<String> applicationIds = mongockTemplate.stream(new Query().addCriteria(Criteria.where(fieldName(QApplication.application.workspaceId)).is(workspace.getId())), Application.class)
                            .stream()
                            .map(Application::getId)
                            .collect(Collectors.toSet());

                    // Update pages
                    Set<Policy> pagePolicies = policyGenerator.getAllChildPolicies(applicationPolicies, Application.class, Page.class);
                    mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QNewPage.newPage.applicationId)).in(applicationIds)),
                            new Update().set("policies", pagePolicies),
                            NewPage.class);

                    // Update NewActions
                    Set<Policy> actionPolicies = policyGenerator.getAllChildPolicies(pagePolicies, Page.class, Action.class);
                    mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QNewAction.newAction.applicationId)).in(applicationIds)),
                            new Update().set("policies", actionPolicies),
                            NewAction.class);

                    // Update ActionCollections
                    mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QActionCollection.actionCollection.applicationId)).in(applicationIds)),
                            new Update().set("policies", actionPolicies),
                            ActionCollection.class);

                    // Update Themes
                    // First update all the named themes with the new policies
                    Set<Policy> themePolicies = policyGenerator.getAllChildPolicies(applicationPolicies, Application.class, Theme.class);
                    mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QTheme.theme.applicationId)).in(applicationIds)),
                            new Update().set("policies", themePolicies),
                            Theme.class);

                    // Also update the non-named themes.
                    // Get the theme ids to update
                    Set<String> themeIdSet = mongockTemplate.stream(new Query().addCriteria(Criteria.where(fieldName(QApplication.application.workspaceId)).is(workspace.getId())), Application.class)
                            .stream()
                            .flatMap(application -> {
                                Set<String> themeIds = new HashSet<>();
                                if (application.getEditModeThemeId() != null) {
                                    themeIds.add(application.getEditModeThemeId());
                                }
                                if (application.getPublishedModeThemeId() != null) {
                                    themeIds.add(application.getPublishedModeThemeId());
                                }
                                return themeIds.stream();
                            })
                            .collect(Collectors.toSet());

                    Criteria nonSystemThemeCriteria = Criteria.where(fieldName(QTheme.theme.isSystemTheme)).is(false);
                    Criteria idCriteria = Criteria.where(fieldName(QTheme.theme.id)).in(themeIdSet);

                    Criteria queryCriteria = new Criteria().andOperator(nonSystemThemeCriteria, idCriteria);

                    // Add the policies to the un-named themes as well.
                    mongockTemplate.updateMulti(
                            new Query(queryCriteria),
                            new Update().set("policies", themePolicies),
                            Theme.class);

                    // Processed, remove temporary flag
                    mongockTemplate.update(Workspace.class)
                            .matching(new Criteria("_id").is(new ObjectId(workspace.getId())))
                            .apply(new Update().unset("inheritPermissions"))
                            .first();
                });
    }

    private void makeApplicationPublic(PolicyUtils policyUtils, PolicyGenerator policyGenerator, NewPageRepository newPageRepository, Application application, Workspace workspace, MongockTemplate mongockTemplate, User anonymousUser) {
        PermissionGroup publicPermissionGroup = new PermissionGroup();
        publicPermissionGroup.setName(application.getName() + " Public");
        publicPermissionGroup.setTenantId(workspace.getTenantId());
        publicPermissionGroup.setDescription("Default permissions generated for sharing an application for viewing.");
        // Use this field to store the application id for rollback
        publicPermissionGroup.setDefaultWorkspaceId(application.getId());

        Set<Policy> applicationPolicies = application.getPolicies();
        Policy makePublicPolicy = applicationPolicies.stream()
                .filter(policy -> policy.getPermission().equals(AclPermission.MAKE_PUBLIC_APPLICATIONS.getValue()))
                .findFirst()
                .get();

        // Let this newly created permission group be assignable by everyone who has permission for make public application
        Policy assignPermissionGroup = Policy.builder()
                .permission(AclPermission.ASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(makePublicPolicy.getPermissionGroups())
                .build();

        // Let this newly created permission group be assignable by everyone who has permission for make public application
        Policy unassignPermissionGroup = Policy.builder()
                .permission(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(makePublicPolicy.getPermissionGroups())
                .build();

        publicPermissionGroup.setPolicies(new HashSet<>(Set.of(assignPermissionGroup, unassignPermissionGroup)));
        publicPermissionGroup.setAssignedToUserIds(Set.of(anonymousUser.getId()));
        publicPermissionGroup = mongockTemplate.save(publicPermissionGroup);

        application.setDefaultPermissionGroup(publicPermissionGroup.getId());

        String permissionGroupId = publicPermissionGroup.getId();

        Map<String, Policy> applicationPolicyMap = policyUtils
                .generatePolicyFromPermissionWithPermissionGroup(AclPermission.READ_APPLICATIONS, permissionGroupId);
        Map<String, Policy> datasourcePolicyMap = policyUtils
                .generatePolicyFromPermissionWithPermissionGroup(AclPermission.EXECUTE_DATASOURCES, permissionGroupId);

        Set<String> datasourceIds = new HashSet<>();

        mongockTemplate.stream(new Query().addCriteria(Criteria.where(fieldName(QNewAction.newAction.applicationId)).is(application.getId())), NewAction.class)
                .stream()
                .forEach(newAction -> {
                    ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                    ActionDTO publishedAction = newAction.getPublishedAction();

                    if (unpublishedAction.getDatasource() != null &&
                            unpublishedAction.getDatasource().getId() != null) {
                        datasourceIds.add(unpublishedAction.getDatasource().getId());
                    }

                    if (publishedAction != null &&
                            publishedAction.getDatasource() != null &&
                            publishedAction.getDatasource().getId() != null) {
                        datasourceIds.add(publishedAction.getDatasource().getId());
                    }
                });

        // Update and save application
        application = policyUtils.addPoliciesToExistingObject(applicationPolicyMap, application);
        mongockTemplate.save(application);
        applicationPolicies = application.getPolicies();

        // Update datasources
        mongockTemplate.stream(new Query().addCriteria(Criteria.where(fieldName(QDatasource.datasource.id)).in(datasourceIds)), Datasource.class)
                .stream()
                .forEach(datasource -> {
                    datasource = policyUtils.addPoliciesToExistingObject(datasourcePolicyMap, datasource);
                    mongockTemplate.save(datasource);
                });

        // Update pages
        Set<Policy> pagePolicies = policyGenerator.getAllChildPolicies(applicationPolicies, Application.class, Page.class);
        mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QNewPage.newPage.applicationId)).is(application.getId())),
                new Update().set("policies", pagePolicies),
                NewPage.class);

        // Update NewActions
        Set<Policy> actionPolicies = policyGenerator.getAllChildPolicies(pagePolicies, Page.class, Action.class);
        mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QNewAction.newAction.applicationId)).is(application.getId())),
                new Update().set("policies", actionPolicies),
                NewAction.class);

        // Update ActionCollections
        mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QActionCollection.actionCollection.applicationId)).is(application.getId())),
                new Update().set("policies", actionPolicies),
                ActionCollection.class);

        // Update Themes
        Set<Policy> themePolicies = policyGenerator.getAllChildPolicies(applicationPolicies, Application.class, Theme.class);
        mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QTheme.theme.applicationId)).is(application.getId())),
                new Update().set("policies", themePolicies),
                Theme.class);
    }

    private void rollbackMakeApplicationsPublic(Application application, MongockTemplate mongockTemplate) {
        PermissionGroup publicPermissionGroup = mongockTemplate
                .stream(new Query().addCriteria(Criteria.where(fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)).is(application.getId())), PermissionGroup.class)
                .stream()
                .findFirst()
                .orElse(null);

        if (publicPermissionGroup != null) {

            // Remove permission group from application policies
            application.getPolicies().forEach(permissionGroup ->
                    permissionGroup.getPermissionGroups().remove(publicPermissionGroup.getId())
            );
            mongockTemplate.save(application);

            Set<String> datasourceIds = new HashSet<>();
            mongockTemplate.stream(new Query().addCriteria(Criteria.where(fieldName(QNewAction.newAction.applicationId)).is(application.getId())), NewAction.class)
                    .stream()
                    .forEach(newAction -> {

                        ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                        ActionDTO publishedAction = newAction.getPublishedAction();

                        if (unpublishedAction.getDatasource() != null &&
                                unpublishedAction.getDatasource().getId() != null) {
                            datasourceIds.add(unpublishedAction.getDatasource().getId());
                        }

                        if (publishedAction != null &&
                                publishedAction.getDatasource() != null &&
                                publishedAction.getDatasource().getId() != null) {
                            datasourceIds.add(publishedAction.getDatasource().getId());
                        }
                    });

            // Remove permission group from datasources policies
            mongockTemplate.stream(new Query().addCriteria(Criteria.where(fieldName(QDatasource.datasource.id)).in(datasourceIds)), Datasource.class)
                    .stream()
                    .forEach(datasource -> {
                        datasource.getPolicies().forEach(permissionGroup ->
                                permissionGroup.getPermissionGroups().remove(publicPermissionGroup.getId())
                        );
                        mongockTemplate.save(datasource);
                    });

            //remove permission group
            mongockTemplate.remove(publicPermissionGroup);
        }
    }

    @ChangeSet(order = "028", id = "make-applications-public", author = "")
    public void makeApplicationsPublic(MongockTemplate mongockTemplate, @NonLockGuarded PolicyUtils policyUtils, @NonLockGuarded PolicyGenerator policyGenerator, NewPageRepository newPageRepository) {
        User anonymousUser = mongockTemplate.findOne(new Query().addCriteria(Criteria.where(fieldName(QUser.user.email)).is(FieldName.ANONYMOUS_USER)), User.class);

        // Rollback permission groups created on locked workspaces
        mongockTemplate.stream(new Query(Criteria.where("locked").is(true)), Application.class)
                .stream()
                .forEach(application -> {
                    rollbackMakeApplicationsPublic(application, mongockTemplate);
                    // unlock the workspace
                    mongockTemplate.update(Application.class)
                            .matching(new Criteria("_id").is(new ObjectId(application.getId())))
                            .apply(new Update().unset("locked"))
                            .first();
                });

        // Make all marked applications public
        mongockTemplate.stream(new Query().addCriteria(Criteria.where("makePublic").is(true)), Application.class)
                .stream()
                .forEach(application -> {
                    // lock the application
                    mongockTemplate.update(Application.class)
                            .matching(new Criteria("_id").is(new ObjectId(application.getId())))
                            .apply(new Update().set("locked", true))
                            .first();

                    Workspace workspace = mongockTemplate.findOne(new Query().addCriteria(Criteria.where(fieldName(QBaseDomain.baseDomain.id)).is(application.getWorkspaceId())), Workspace.class);
                    makeApplicationPublic(policyUtils, policyGenerator, newPageRepository, application, workspace, mongockTemplate, anonymousUser);
                    // Remove makePublic flag from application
                    mongockTemplate.updateFirst(new Query().addCriteria(Criteria.where("_id").is(new ObjectId(application.getId()))),
                            new Update().unset("makePublic"),
                            Application.class);

                    // unlock the application
                    mongockTemplate.update(Application.class)
                            .matching(new Criteria("_id").is(new ObjectId(application.getId())))
                            .apply(new Update().unset("locked"))
                            .first();
                });
    }

    @ChangeSet(order = "029", id = "add-instance-config-object", author = "")
    public void addInstanceConfigurationPlaceHolder(MongockTemplate mongockTemplate) {
        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongockTemplate.findOne(instanceConfigurationQuery, Config.class);

        if (instanceAdminConfiguration != null) {
            return;
        }

        instanceAdminConfiguration = new Config();
        instanceAdminConfiguration.setName(FieldName.INSTANCE_CONFIG);
        Config savedInstanceConfig = mongockTemplate.save(instanceAdminConfiguration);

        // Create instance management permission group
        PermissionGroup instanceManagerPermissionGroup = new PermissionGroup();
        instanceManagerPermissionGroup.setName(FieldName.INSTANCE_ADMIN_ROLE);
        instanceManagerPermissionGroup.setPermissions(
                Set.of(
                        new Permission(savedInstanceConfig.getId(), MANAGE_INSTANCE_CONFIGURATION)
                )
        );

        Query adminUserQuery = new Query();
        adminUserQuery.addCriteria(where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(where("permission").is(MANAGE_INSTANCE_ENV.getValue())));
        List<User> adminUsers = mongockTemplate.find(adminUserQuery, User.class);

        instanceManagerPermissionGroup.setAssignedToUserIds(
                adminUsers.stream().map(User::getId).collect(Collectors.toSet())
        );

        PermissionGroup savedPermissionGroup = mongockTemplate.save(instanceManagerPermissionGroup);

        // Update the instance config with the permission group id
        savedInstanceConfig.setConfig(new JSONObject(Map.of(DEFAULT_PERMISSION_GROUP, savedPermissionGroup.getId())));

        Policy editConfigPolicy = Policy.builder().permission(MANAGE_INSTANCE_CONFIGURATION.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();
        Policy readConfigPolicy = Policy.builder().permission(READ_INSTANCE_CONFIGURATION.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        savedInstanceConfig.setPolicies(new HashSet<>(Set.of(editConfigPolicy, readConfigPolicy)));

        mongockTemplate.save(savedInstanceConfig);

        // Also give the permission group permission to unassign & assign & read to itself
        Policy updatePermissionGroupPolicy = Policy.builder().permission(AclPermission.UNASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        Policy assignPermissionGroupPolicy = Policy.builder().permission(ASSIGN_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        Policy readPermissionGroupPolicy = Policy.builder().permission(READ_PERMISSION_GROUPS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        savedPermissionGroup.setPolicies(new HashSet<>(Set.of(updatePermissionGroupPolicy, assignPermissionGroupPolicy)));

        Set<Permission> permissions = new HashSet<>(savedPermissionGroup.getPermissions());
        permissions.addAll(
                Set.of(
                        new Permission(savedPermissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS),
                        new Permission(savedPermissionGroup.getId(), ASSIGN_PERMISSION_GROUPS),
                        new Permission(savedPermissionGroup.getId(), READ_PERMISSION_GROUPS)
                )
        );
        savedPermissionGroup.setPermissions(permissions);

        mongockTemplate.save(savedPermissionGroup);
    }

    @ChangeSet(order = "030", id = "add-anonymous-user-permission-group", author = "")
    public void addAnonymousUserPermissionGroup(MongockTemplate mongockTemplate) {
        Query anonymousUserPermissionConfig = new Query();
        anonymousUserPermissionConfig.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.PUBLIC_PERMISSION_GROUP));

        Config publicPermissionGroupConfig = mongockTemplate.findOne(anonymousUserPermissionConfig, Config.class);

        if (publicPermissionGroupConfig != null) {
            return;
        }

        PermissionGroup publicPermissionGroup = new PermissionGroup();
        publicPermissionGroup.setName(FieldName.PUBLIC_PERMISSION_GROUP);
        publicPermissionGroup.setDescription("Role for giving accesses for all objects to anonymous users");

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant tenant = mongockTemplate.findOne(tenantQuery, Tenant.class);

        Query userQuery = new Query();
        userQuery.addCriteria(where(fieldName(QUser.user.email)).is(FieldName.ANONYMOUS_USER))
                .addCriteria(where(fieldName(QUser.user.tenantId)).is(tenant.getId()));
        User anonymousUser = mongockTemplate.findOne(userQuery, User.class);


        // Give access to anonymous user to the permission group.
        publicPermissionGroup.setAssignedToUserIds(Set.of(anonymousUser.getId()));
        PermissionGroup savedPermissionGroup = mongockTemplate.save(publicPermissionGroup);

        publicPermissionGroupConfig = new Config();
        publicPermissionGroupConfig.setName(FieldName.PUBLIC_PERMISSION_GROUP);

        publicPermissionGroupConfig.setConfig(new JSONObject(Map.of(PERMISSION_GROUP_ID, savedPermissionGroup.getId())));

        mongockTemplate.save(publicPermissionGroupConfig);
        return;
    }

    @ChangeSet(order = "031", id = "create-system-themes-v3", author = "", runAlways = true)
    public void createSystemThemes3(MongockTemplate mongockTemplate) throws IOException {
        Index systemThemeIndex = new Index()
                .on(fieldName(QTheme.theme.isSystemTheme), Sort.Direction.ASC)
                .named("system_theme_index")
                .background();

        Index applicationIdIndex = new Index()
                .on(fieldName(QTheme.theme.applicationId), Sort.Direction.ASC)
                .on(fieldName(QTheme.theme.deleted), Sort.Direction.ASC)
                .named("application_id_index")
                .background();

        dropIndexIfExists(mongockTemplate, Theme.class, "system_theme_index");
        dropIndexIfExists(mongockTemplate, Theme.class, "application_id_index");
        ensureIndexes(mongockTemplate, Theme.class, systemThemeIndex, applicationIdIndex);

        final String themesJson = StreamUtils.copyToString(
                new DefaultResourceLoader().getResource("system-themes.json").getInputStream(),
                Charset.defaultCharset()
        );
        Theme[] themes = new Gson().fromJson(themesJson, Theme[].class);

        Theme legacyTheme = null;
        boolean themeExists = false;

        // Make this theme accessible to anonymous users.
        Query anonymousUserPermissionConfig = new Query();
        anonymousUserPermissionConfig.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.PUBLIC_PERMISSION_GROUP));
        Config publicPermissionGroupConfig = mongockTemplate.findOne(anonymousUserPermissionConfig, Config.class);

        String permissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);

        PermissionGroup publicPermissionGroup = mongockTemplate.findOne(query(where("_id").is(permissionGroupId)), PermissionGroup.class);

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
            Query query = new Query(Criteria.where(fieldName(QTheme.theme.name)).is(theme.getName())
                    .and(fieldName(QTheme.theme.isSystemTheme)).is(true));

            Theme savedTheme = mongockTemplate.findOne(query, Theme.class);
            if (savedTheme == null) {  // this theme does not exist, create it
                savedTheme = mongockTemplate.save(theme);
            } else { // theme already found, update
                themeExists = true;
                savedTheme.setDisplayName(theme.getDisplayName());
                savedTheme.setPolicies(theme.getPolicies());
                savedTheme.setConfig(theme.getConfig());
                savedTheme.setProperties(theme.getProperties());
                savedTheme.setStylesheet(theme.getStylesheet());
                if (savedTheme.getCreatedAt() == null) {
                    savedTheme.setCreatedAt(Instant.now());
                }
                mongockTemplate.save(savedTheme);
            }

            if (theme.getName().equalsIgnoreCase(Theme.LEGACY_THEME_NAME)) {
                legacyTheme = savedTheme;
            }

            // Add the access to this theme to the public permission group
            Theme finalSavedTheme = savedTheme;
            boolean isThemePermissionPresent = permissions.stream()
                    .filter(p -> p.getAclPermission().equals(READ_THEMES) && p.getDocumentId().equals(finalSavedTheme.getId()))
                    .findFirst()
                    .isPresent();
            if (!isThemePermissionPresent) {
                permissions.add(new Permission(finalSavedTheme.getId(), READ_THEMES));
            }
        }

        if (!themeExists) { // this is the first time we're running the migration
            // migrate all applications and set legacy theme to them in both mode
            Update update = new Update().set(fieldName(QApplication.application.publishedModeThemeId), legacyTheme.getId())
                    .set(fieldName(QApplication.application.editModeThemeId), legacyTheme.getId());
            mongockTemplate.updateMulti(
                    new Query(where(fieldName(QApplication.application.deleted)).is(false)), update, Application.class
            );
        }

        // Finally save the role which gives access to all the system themes to the anonymous user.
        publicPermissionGroup.setPermissions(permissions);
        mongockTemplate.save(publicPermissionGroup);
    }

    @ChangeSet(order = "32", id = "create-indices-on-permissions-for-performance", author = "")
    public void addPermissionGroupIndex(MongockTemplate mongockTemplate) {

        dropIndexIfExists(mongockTemplate, PermissionGroup.class, "permission_group_workspace_deleted_compound_index");
        dropIndexIfExists(mongockTemplate, PermissionGroup.class, "permission_group_assignedUserIds_deleted_compound_index");

        Index workspace_deleted_compound_index = makeIndex(
                fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId),
                fieldName(QPermissionGroup.permissionGroup.deleted)
        )
                .named("permission_group_workspace_deleted_compound_index");

        Index assignedToUserIds_deleted_compound_index = makeIndex(
                fieldName(QPermissionGroup.permissionGroup.assignedToUserIds),
                fieldName(QPermissionGroup.permissionGroup.deleted)
        )
                .named("permission_group_assignedUserIds_deleted_compound_index");

        ensureIndexes(mongockTemplate, PermissionGroup.class,
                workspace_deleted_compound_index,
                assignedToUserIds_deleted_compound_index
        );
    }

    @ChangeSet(order = "033", id = "update-super-users", author = "", runAlways = true)
    public void updateSuperUsers(MongockTemplate mongockTemplate, CacheableRepositoryHelper cacheableRepositoryHelper) {
        // Read the admin emails from the environment and update the super users accordingly
        String adminEmailsStr = System.getenv(String.valueOf(APPSMITH_ADMIN_EMAILS));

        Set<String> adminEmails = TextUtils.csvToSet(adminEmailsStr);

        Query instanceConfigurationQuery = new Query();
        instanceConfigurationQuery.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.INSTANCE_CONFIG));
        Config instanceAdminConfiguration = mongockTemplate.findOne(instanceConfigurationQuery, Config.class);

        String instanceAdminPermissionGroupId = (String) instanceAdminConfiguration.getConfig().get(DEFAULT_PERMISSION_GROUP);

        Query permissionGroupQuery = new Query();
        permissionGroupQuery.addCriteria(where(fieldName(QPermissionGroup.permissionGroup.id)).is(instanceAdminPermissionGroupId));
        PermissionGroup instanceAdminPG = mongockTemplate.findOne(permissionGroupQuery, PermissionGroup.class);

        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant tenant = mongockTemplate.findOne(tenantQuery, Tenant.class);

        Set<String> userIds = adminEmails.stream()
                .map(email -> email.trim())
                .map(String::toLowerCase)
                .map(email -> {
                    Query userQuery = new Query();
                    userQuery.addCriteria(where(fieldName(QUser.user.email)).is(email));
                    User user = mongockTemplate.findOne(userQuery, User.class);

                    if (user == null) {
                        log.info("Creating super user with username {}", email);
                        user = createNewUser(email, tenant.getId(), mongockTemplate);
                    }

                    return user.getId();
                })
                .collect(Collectors.toSet());

        Set<String> oldSuperUsers = instanceAdminPG.getAssignedToUserIds();
        Set<String> updatedUserIds = findSymmetricDiff(oldSuperUsers, userIds);
        evictPermissionCacheForUsers(updatedUserIds, mongockTemplate, cacheableRepositoryHelper);
        instanceAdminPG.setAssignedToUserIds(userIds);
        mongockTemplate.save(instanceAdminPG);
    }

    private User createNewUser(String email, String tenantId, MongockTemplate mongockTemplate) {
        User user = new User();
        user.setEmail(email);
        user.setIsEnabled(false);
        user.setTenantId(tenantId);
        user.setCreatedAt(Instant.now());
        user = mongockTemplate.save(user);

        // Assign the user to the default permissions
        PermissionGroup userManagementPermissionGroup = new PermissionGroup();
        userManagementPermissionGroup.setName(user.getUsername() + " User Management");
        // Add CRUD permissions for user to the group
        userManagementPermissionGroup.setPermissions(
                Set.of(
                        new Permission(user.getId(), MANAGE_USERS)
                )
        );

        // Assign the permission group to the user
        userManagementPermissionGroup.setAssignedToUserIds(Set.of(user.getId()));

        PermissionGroup savedPermissionGroup = mongockTemplate.save(userManagementPermissionGroup);

        Policy readUserPolicy = Policy.builder()
                .permission(READ_USERS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();
        Policy manageUserPolicy = Policy.builder()
                .permission(MANAGE_USERS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();
        Policy resetPwdPolicy = Policy.builder()
                .permission(RESET_PASSWORD_USERS.getValue())
                .permissionGroups(Set.of(savedPermissionGroup.getId()))
                .build();

        user.setPolicies(Set.of(readUserPolicy, manageUserPolicy, resetPwdPolicy));

        return mongockTemplate.save(user);
    }

    @ChangeSet(order = "034", id = "update-bad-theme-state", author = "")
    public void updateBadThemeState(MongockTemplate mongockTemplate, @NonLockGuarded PolicyGenerator policyGenerator,
                                    CacheableRepositoryHelper cacheableRepositoryHelper) {
        Query query = new Query();
        query.addCriteria(
                new Criteria().andOperator(
                        new Criteria(fieldName(QTheme.theme.isSystemTheme)).is(false),
                        new Criteria(fieldName(QTheme.theme.deleted)).is(false)
                )
        );

        mongockTemplate.stream(query, Theme.class)
                .stream()
                .forEach(theme -> {
                    Query applicationQuery = new Query();
                    Criteria themeCriteria = new Criteria(fieldName(QApplication.application.editModeThemeId)).is(theme.getId())
                            .orOperator(new Criteria(fieldName(QApplication.application.publishedModeThemeId)).is(theme.getId()));

                    List<Application> applications = mongockTemplate.find(applicationQuery.addCriteria(themeCriteria), Application.class);
                    // This is an erroneous state where the theme is being used by multiple applications
                    if (applications != null && applications.size() > 1) {
                        // Create new themes for the rest of the applications which are copies of the original theme
                        for (int i = 0; i < applications.size(); i++) {
                            Application application = applications.get(i);
                            Set<Policy> themePolicies = policyGenerator.getAllChildPolicies(application.getPolicies(), Application.class, Theme.class);

                            if (i == 0) {
                                // Don't create a new theme for the first application
                                // Just update the policies
                                theme.setPolicies(themePolicies);
                                mongockTemplate.save(theme);
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

                                newTheme = mongockTemplate.save(newTheme);

                                if (application.getEditModeThemeId().equals(theme.getId())) {
                                    application.setEditModeThemeId(newTheme.getId());
                                }
                                if (application.getPublishedModeThemeId().equals(theme.getId())) {
                                    application.setPublishedModeThemeId(newTheme.getId());
                                }
                                mongockTemplate.save(application);
                            }
                        }
                    }
                });
    }

    @ChangeSet(order = "035", id = "migrate-public-apps-single-pg", author = "")
    public void migratePublicAppsSinglePg(MongockTemplate mongockTemplate, @NonLockGuarded PolicyUtils policyUtils, @NonLockGuarded PolicyGenerator policyGenerator, CacheableRepositoryHelper cacheableRepositoryHelper) {

        Query anonymousUserPermissionConfig = new Query();
        anonymousUserPermissionConfig.addCriteria(where(fieldName(QConfig.config1.name)).is(FieldName.PUBLIC_PERMISSION_GROUP));
        Config publicPermissionGroupConfig = mongockTemplate.findOne(anonymousUserPermissionConfig, Config.class);

        String permissionGroupId = publicPermissionGroupConfig.getConfig().getAsString(PERMISSION_GROUP_ID);

        ConcurrentHashMap<String, Boolean> oldPermissionGroupMap = new ConcurrentHashMap<>();
        ConcurrentHashMap.KeySetView<Object, Boolean> oldPgIds = oldPermissionGroupMap.newKeySet();
        // Find all public apps
        Query publicAppQuery = new Query();
        publicAppQuery.addCriteria(where(fieldName(QApplication.application.defaultPermissionGroup)).exists(true));

        org.springframework.data.util.StreamUtils.createStreamFromIterator(mongockTemplate.stream(publicAppQuery, Application.class))
                .parallel()
                .forEach(application -> {
                    String oldPermissionGroupId = application.getDefaultPermissionGroup();
                    // Store the existing permission group providing view access to the app for cleanup
                    oldPgIds.add(oldPermissionGroupId);
                    application.setDefaultPermissionGroup(null);

                    // Update the application policies to use the public permission group
                    application.getPolicies()
                            .stream()
                            .filter(policy -> policy.getPermissionGroups().contains(oldPermissionGroupId))
                            .forEach(policy -> {
                                policy.getPermissionGroups().remove(oldPermissionGroupId);
                                policy.getPermissionGroups().add(permissionGroupId);
                            });
                    mongockTemplate.save(application);

                    Set<String> datasourceIds = new HashSet<>();
                    Query applicationActionsQuery = new Query().addCriteria(where(fieldName(QNewAction.newAction.applicationId)).is(application.getId()));
                    // Only fetch the datasources that are used in the action
                    applicationActionsQuery.fields()
                            .include(fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.datasource))
                            .include(fieldName(QNewAction.newAction.publishedAction) + "." + fieldName(QNewAction.newAction.publishedAction.datasource));

                    mongockTemplate.stream(applicationActionsQuery, NewAction.class)
                            .stream()
                            .forEach(newAction -> {
                                ActionDTO unpublishedAction = newAction.getUnpublishedAction();
                                ActionDTO publishedAction = newAction.getPublishedAction();

                                if (unpublishedAction.getDatasource() != null &&
                                        unpublishedAction.getDatasource().getId() != null) {
                                    datasourceIds.add(unpublishedAction.getDatasource().getId());
                                }

                                if (publishedAction != null &&
                                        publishedAction.getDatasource() != null &&
                                        publishedAction.getDatasource().getId() != null) {
                                    datasourceIds.add(publishedAction.getDatasource().getId());
                                }
                            });

                    // Update datasources
                    Query datasourceQuery = new Query().addCriteria(where(fieldName(QDatasource.datasource.id)).in(datasourceIds));
                    mongockTemplate.stream(datasourceQuery, Datasource.class)
                            .stream()
                            .parallel()
                            .forEach(datasource -> {
                                // Update the datasource policies.
                                datasource.getPolicies()
                                        .stream()
                                        .filter(policy -> policy.getPermissionGroups().contains(oldPermissionGroupId))
                                        .forEach(policy -> {
                                            policy.getPermissionGroups().remove(oldPermissionGroupId);
                                            policy.getPermissionGroups().add(permissionGroupId);
                                        });
                                mongockTemplate.save(datasource);
                            });

                    // Update pages
                    Set<Policy> pagePolicies = policyGenerator.getAllChildPolicies(application.getPolicies(), Application.class, Page.class);
                    mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QNewPage.newPage.applicationId)).is(application.getId())),
                            new Update().set(fieldName(QNewPage.newPage.policies), pagePolicies),
                            NewPage.class);

                    // Update actions
                    Set<Policy> actionPolicies = policyGenerator.getAllChildPolicies(pagePolicies, Page.class, Action.class);
                    mongockTemplate.updateMulti(new Query().addCriteria(where(fieldName(QNewAction.newAction.applicationId)).is(application.getId())),
                            new Update().set(fieldName(QNewAction.newAction.policies), actionPolicies),
                            NewAction.class);

                    // Update js objects
                    mongockTemplate.updateMulti(new Query().addCriteria(Criteria.where(fieldName(QActionCollection.actionCollection.applicationId)).is(application.getId())),
                            new Update().set(fieldName(QActionCollection.actionCollection.policies), actionPolicies),
                            ActionCollection.class);

                    // Update application themes
                    Criteria nonSystemThemeCriteria = Criteria.where(fieldName(QTheme.theme.isSystemTheme)).is(false);
                    Criteria idCriteria = Criteria.where(fieldName(QTheme.theme.id)).in(
                            application.getEditModeThemeId(),
                            application.getPublishedModeThemeId()
                    );
                    Criteria queryCriteria = new Criteria().andOperator(nonSystemThemeCriteria, idCriteria);
                    Set<Policy> themePolicies = policyGenerator.getAllChildPolicies(application.getPolicies(), Application.class, Theme.class);
                    mongockTemplate.updateMulti(new Query().addCriteria(queryCriteria),
                            new Update().set(fieldName(QTheme.theme.policies), themePolicies),
                            Theme.class);
                });
        // All the applications have been migrated.

        // Clean up all the permission groups which were created to provide views to public apps
        mongockTemplate.findAllAndRemove(new Query().addCriteria(Criteria.where(fieldName(QPermissionGroup.permissionGroup.id)).in(oldPgIds)), PermissionGroup.class);

        // Finally evict the anonymous user cache entry so that it gets recomputed on next use.
        Query tenantQuery = new Query();
        tenantQuery.addCriteria(where(fieldName(QTenant.tenant.slug)).is("default"));
        Tenant tenant = mongockTemplate.findOne(tenantQuery, Tenant.class);

        Query userQuery = new Query();
        userQuery.addCriteria(where(fieldName(QUser.user.email)).is(FieldName.ANONYMOUS_USER))
                .addCriteria(where(fieldName(QUser.user.tenantId)).is(tenant.getId()));
        User anonymousUser = mongockTemplate.findOne(userQuery, User.class);
        evictPermissionCacheForUsers(Set.of(anonymousUser.getId()), mongockTemplate, cacheableRepositoryHelper);
    }

    @ChangeSet(order = "036", id = "add-graphql-plugin", author = "")
    public void addGraphQLPlugin(MongockTemplate mongoTemplate) {
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

    /**
     * This method attempts to add GraphQL plugin to all workspaces once again since the last migration was
     * interrupted due to issues on prod cluster. Hence, during the last migration the plugin could not be installed in
     * few workspaces.The method installPluginToAllWorkspaces only installs the plugin in those workspaces where it is
     * missing.
     */
    @ChangeSet(order = "037", id = "install-graphql-plugin-to-remaining-workspaces", author = "")
    public void reInstallGraphQLPluginToWorkspaces(MongockTemplate mongoTemplate) {
        Plugin graphQLPlugin = mongoTemplate
                .findOne(query(where("packageName").is("graphql-plugin")), Plugin.class);
        installPluginToAllWorkspaces(mongoTemplate, graphQLPlugin.getId());
    }

    public void softDeletePlugin(MongockTemplate mongockTemplate, Plugin plugin) {
        softDeleteAllPluginActions(plugin, mongockTemplate);
        softDeleteAllPluginDatasources(plugin, mongockTemplate);
        softDeletePluginFromAllWorkspaces(plugin, mongockTemplate);
        softDeleteInPluginCollection(plugin, mongockTemplate);
    }

    @ChangeSet(order = "038", id = "delete-rapid-api-plugin-related-items", author = "")
    public void deleteRapidApiPluginRelatedItems(MongockTemplate mongockTemplate) {
        Plugin rapidApiPlugin = mongockTemplate.findOne(query(where("packageName").is("rapidapi-plugin")),
                Plugin.class);

        if (rapidApiPlugin == null) {
            return;
        }

        softDeletePlugin(mongockTemplate, rapidApiPlugin);
    }

    private void softDeletePluginFromAllWorkspaces(Plugin plugin, MongockTemplate mongockTemplate) {
        Query queryToGetNonDeletedWorkspaces = new Query();
        queryToGetNonDeletedWorkspaces.fields().include(fieldName(QWorkspace.workspace.id));
        List<Workspace> workspaces = mongockTemplate.find(queryToGetNonDeletedWorkspaces, Workspace.class);
        workspaces.stream()
                .map(Workspace::getId)
                .map(id -> fetchDomainObjectUsingId(id, mongockTemplate, QWorkspace.workspace.id, Workspace.class))
                .forEachOrdered(workspace -> {
                    workspace.getPlugins().stream()
                            .filter(workspacePlugin -> workspacePlugin != null && workspacePlugin.getPluginId() != null)
                            .filter(workspacePlugin -> workspacePlugin.getPluginId().equals(plugin.getId()))
                            .forEach(workspacePlugin -> {
                                workspacePlugin.setDeleted(true);
                                workspacePlugin.setDeletedAt(Instant.now());
                            });
                    mongockTemplate.save(workspace);
                });
    }

    private void softDeleteInPluginCollection(Plugin plugin, MongockTemplate mongockTemplate) {
        plugin.setDeleted(true);
        plugin.setDeletedAt(Instant.now());
        mongockTemplate.save(plugin);
    }

    private void softDeleteAllPluginDatasources(Plugin plugin, MongockTemplate mongockTemplate) {
        /* Query to get all plugin datasources which are not deleted */
        Query queryToGetDatasources = getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(plugin);

        /* Update the previous query to only include id field */
        queryToGetDatasources.fields().include(fieldName(QDatasource.datasource.id));

        /* Fetch plugin datasources using the previous query */
        List<Datasource> datasources = mongockTemplate.find(queryToGetDatasources, Datasource.class);

        /* Mark each selected datasource as deleted */
        updateDeleteAndDeletedAtFieldsForEachDomainObject(datasources, mongockTemplate,
                QDatasource.datasource.id, Datasource.class);
    }

    private void softDeleteAllPluginActions(Plugin plugin, MongockTemplate mongockTemplate) {
        /* Query to get all plugin actions which are not deleted */
        Query queryToGetActions = getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(plugin);

        /* Update the previous query to only include id field */
        queryToGetActions.fields().include(fieldName(QNewAction.newAction.id));

        /* Fetch plugin actions using the previous query */
        List<NewAction> actions = mongockTemplate.find(queryToGetActions, NewAction.class);

        /* Mark each selected action as deleted */
        updateDeleteAndDeletedAtFieldsForEachDomainObject(actions, mongockTemplate, QNewAction.newAction.id,
                NewAction.class);
    }

    private Query getQueryToFetchAllDomainObjectsWhichAreNotDeletedUsingPluginId(Plugin plugin) {
        Criteria pluginIdMatchesSuppliedPluginId = where("pluginId").is(plugin.getId());
        Criteria isNotDeleted = where("deleted").ne(true);
        return query((new Criteria()).andOperator(pluginIdMatchesSuppliedPluginId, isNotDeleted));
    }

    private <T extends BaseDomain> void updateDeleteAndDeletedAtFieldsForEachDomainObject(List<? extends BaseDomain> domainObjects,
                                                                                          MongockTemplate mongockTemplate, Path path,
                                                                                          Class<T> type) {
        domainObjects.stream()
                .map(BaseDomain::getId) // iterate over id one by one
                .map(id -> fetchDomainObjectUsingId(id, mongockTemplate, path, type)) // find object using id
                .forEachOrdered(domainObject -> {
                    domainObject.setDeleted(true);
                    domainObject.setDeletedAt(Instant.now());
                    mongockTemplate.save(domainObject);
                });
    }

    /**
     * Here 'id' refers to the ObjectId which is used to uniquely identify each Mongo document. 'path' refers to the
     * path in the Query DSL object that indicates which field in a document should be matched against the `id`.
     * `type` is a POJO class type that indicates which collection we are interested in. eg. path=QNewAction
     * .newAction.id, type=NewAction.class
     */
    private <T extends BaseDomain> T fetchDomainObjectUsingId(String id, MongockTemplate mongockTemplate, Path path,
                                                              Class<T> type) {
        final T domainObject = mongockTemplate.findOne(query(where(fieldName(path)).is(id)), type);
        return domainObject;
    }
}