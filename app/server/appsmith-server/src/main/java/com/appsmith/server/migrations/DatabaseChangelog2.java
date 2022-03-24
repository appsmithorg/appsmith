package com.appsmith.server.migrations;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationPlugin;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.QPlugin;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.OrganizationPluginStatus;
import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import com.github.cloudyrock.mongock.driver.mongodb.springdata.v3.decorator.impl.MongockTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.CollectionUtils;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
                Query.query(Criteria.where(fieldName(QPlugin.plugin.packageName)).is("mysql-plugin")),
                Update.update(fieldName(QPlugin.plugin.name), "MySQL"),
                Plugin.class
        );

        mongockTemplate.updateFirst(
                Query.query(Criteria.where(fieldName(QPlugin.plugin.packageName)).is("mssql-plugin")),
                Update.update(fieldName(QPlugin.plugin.name), "Microsoft SQL Server"),
                Plugin.class
        );

        mongockTemplate.updateFirst(
                Query.query(Criteria.where(fieldName(QPlugin.plugin.packageName)).is("elasticsearch-plugin")),
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

    // TODO: refactor to avoid duplication
    private void installPluginToAllOrganizations(MongockTemplate mongockTemplate, String pluginId) {
        for (Organization organization : mongockTemplate.findAll(Organization.class)) {
            if (CollectionUtils.isEmpty(organization.getPlugins())) {
                organization.setPlugins(new HashSet<>());
            }

            final Set<String> installedPlugins = organization.getPlugins()
                    .stream().map(OrganizationPlugin::getPluginId).collect(Collectors.toSet());

            if (!installedPlugins.contains(pluginId)) {
                organization.getPlugins()
                        .add(new OrganizationPlugin(pluginId, OrganizationPluginStatus.FREE));
            }

            mongockTemplate.save(organization);
        }
    }

    @ChangeSet(order = "003", id = "add-graphql-plugin", author = "")
    public void addGraphQLPlugin(MongockTemplate mongoTemplate) {
        Plugin plugin = new Plugin();
        plugin.setName("GraphQL");
        plugin.setType(PluginType.API);
        plugin.setPackageName("graphql-plugin");
        plugin.setUiComponent("GraphQLEditorForm"); // TODO: make it ApiEditorForm -> GraphQLEditorForm
        plugin.setDatasourceComponent("AutoForm");
        plugin.setResponseType(Plugin.ResponseType.JSON);
        plugin.setIconLocation("https://upload.wikimedia.org/wikipedia/commons/1/17/GraphQL_Logo.svg"); // TODO: update
        plugin.setDocumentationLink("https://docs.appsmith.com/datasource-reference/querying-graphql-db");
        plugin.setDefaultInstall(true);
        try {
            mongoTemplate.insert(plugin);
        } catch (DuplicateKeyException e) {
            log.warn(plugin.getPackageName() + " already present in database.");
        }

        installPluginToAllOrganizations(mongoTemplate, plugin.getId());
    }

}
