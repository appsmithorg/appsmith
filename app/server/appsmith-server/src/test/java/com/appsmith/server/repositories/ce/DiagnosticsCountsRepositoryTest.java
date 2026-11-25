package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.McpKey;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationDiagnosticsCounts;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.McpKeyRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import static com.appsmith.server.migrations.db.ce.Migration077AddDiagnosticsIndexToNewAction.DIAGNOSTICS_EDITABLE_ACTIONS;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DiagnosticsCountsRepositoryTest {

    private static final String UNKNOWN_STORED_TYPE = "LEGACY_REMOVED_TYPE";

    @Autowired
    private ReactiveMongoOperations mongoOperations;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private NewPageRepository newPageRepository;

    @Autowired
    private NewActionRepository newActionRepository;

    @Autowired
    private ActionCollectionRepository actionCollectionRepository;

    @Autowired
    private DatasourceRepository datasourceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private McpKeyRepository mcpKeyRepository;

    private final Map<String, List<ObjectId>> seeded = new HashMap<>();

    @AfterEach
    void cleanUp() {
        seeded.forEach((collection, ids) -> mongoOperations
                .remove(Query.query(Criteria.where("_id").in(ids)), collection)
                .block());
        seeded.clear();
    }

    @Test
    void should_countDefaultBranchOnly_when_appHasBranches() {
        // Given
        ApplicationDiagnosticsCounts before = applicationCounts();
        seed(Application.class, app().append("gitApplicationMetadata", git("main", "main", true)));
        seed(Application.class, app().append("gitApplicationMetadata", git("main", "f1", true)));
        seed(Application.class, app().append("gitApplicationMetadata", git("main", "f2", false)));
        seed(Application.class, app());
        seed(Application.class, app().append("gitApplicationMetadata", new Document("repoName", "legacy")));

        // When
        ApplicationDiagnosticsCounts after = applicationCounts();

        // Then
        assertThat(after.applications() - before.applications()).isEqualTo(3);
        assertThat(after.gitBranchDocuments() - before.gitBranchDocuments()).isEqualTo(3);
        assertThat(after.gitConnected() - before.gitConnected()).isEqualTo(1);
    }

    @Test
    void should_notCountTagDocument_when_refTypeIsTag() {
        // Given
        ApplicationDiagnosticsCounts before = applicationCounts();
        seed(Application.class, app().append("gitApplicationMetadata", git("main", "main", true)));
        seed(
                Application.class,
                app().append("gitApplicationMetadata", git("main", "main", true).append("refType", "branch")));
        seed(
                Application.class,
                app().append("gitApplicationMetadata", git("main", "main", true).append("refType", "tag")));
        seed(
                Application.class,
                app().append("gitApplicationMetadata", git("main", "v1", false).append("refType", "tag")));

        // When
        ApplicationDiagnosticsCounts after = applicationCounts();

        // Then
        assertThat(after.applications() - before.applications()).isEqualTo(2);
        assertThat(after.gitBranchDocuments() - before.gitBranchDocuments()).isEqualTo(2);
        assertThat(after.gitConnected() - before.gitConnected()).isEqualTo(2);
    }

    @Test
    void should_splitPublishedAndDraft_when_lastDeployedAtVaries() {
        // Given
        ApplicationDiagnosticsCounts before = applicationCounts();
        seed(Application.class, app().append("lastDeployedAt", new Date()));
        seed(Application.class, app().append("lastDeployedAt", null));
        seed(Application.class, app());
        seed(
                Application.class,
                app().append("lastDeployedAt", new Date()).append("gitApplicationMetadata", git("main", "f1", false)));

        // When
        ApplicationDiagnosticsCounts after = applicationCounts();

        // Then
        assertThat(after.applications() - before.applications()).isEqualTo(3);
        assertThat(after.published() - before.published()).isEqualTo(1);
        assertThat(after.draft() - before.draft()).isEqualTo(2);
    }

    @Test
    void should_excludeSoftDeleted_when_deletedAtOrLegacyFlag() {
        // Given
        long workspacesBefore = workspaceRepository.countForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        ApplicationDiagnosticsCounts appsBefore = applicationCounts();
        long pagesBefore =
                newPageRepository.countEditableForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        Map<String, Long> actionsBefore = actionCounts();
        long collectionsBefore =
                actionCollectionRepository.countEditableForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        for (Class<?> domain :
                List.of(Workspace.class, Application.class, NewPage.class, NewAction.class, ActionCollection.class)) {
            seed(domain, new Document("pluginType", "DB").append("deletedAt", new Date()));
            seed(domain, new Document("pluginType", "DB").append("deleted", true));
        }

        // When
        long workspacesAfter = workspaceRepository.countForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        ApplicationDiagnosticsCounts appsAfter = applicationCounts();
        long pagesAfter = newPageRepository.countEditableForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        Map<String, Long> actionsAfter = actionCounts();
        long collectionsAfter =
                actionCollectionRepository.countEditableForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(workspacesAfter).isEqualTo(workspacesBefore);
        assertThat(appsAfter).isEqualTo(appsBefore);
        assertThat(pagesAfter).isEqualTo(pagesBefore);
        assertThat(actionsAfter).isEqualTo(actionsBefore);
        assertThat(collectionsAfter).isEqualTo(collectionsBefore);
    }

    @Test
    void should_excludeEditDeleted_when_unpublishedDeletedAtSet() {
        // Given
        long pagesBefore =
                newPageRepository.countEditableForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        Map<String, Long> actionsBefore = actionCounts();
        long collectionsBefore =
                actionCollectionRepository.countEditableForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        seed(NewPage.class, new Document("unpublishedPage", new Document("name", "kept")));
        seed(NewPage.class, new Document("unpublishedPage", new Document("deletedAt", new Date())));
        seed(NewAction.class, new Document("pluginType", "API").append("unpublishedAction", new Document()));
        seed(
                NewAction.class,
                new Document("pluginType", "API").append("unpublishedAction", new Document("deletedAt", new Date())));
        seed(ActionCollection.class, new Document("unpublishedCollection", new Document("name", "kept")));
        seed(ActionCollection.class, new Document("unpublishedCollection", new Document("deletedAt", new Date())));

        // When
        long pagesAfter = newPageRepository.countEditableForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        Map<String, Long> actionsAfter = actionCounts();
        long collectionsAfter =
                actionCollectionRepository.countEditableForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(pagesAfter - pagesBefore).isEqualTo(1);
        assertThat(delta(actionsBefore, actionsAfter, "API")).isEqualTo(1);
        assertThat(collectionsAfter - collectionsBefore).isEqualTo(1);
    }

    @Test
    void should_groupActionsByPluginType_when_mixed() {
        // Given
        Map<String, Long> before = actionCounts();
        seed(NewAction.class, new Document("pluginType", "DB"));
        seed(NewAction.class, new Document("pluginType", "DB"));
        seed(NewAction.class, new Document("pluginType", "JS"));
        seed(NewAction.class, new Document("pluginType", null));

        // When
        Map<String, Long> after = actionCounts();

        // Then
        assertThat(delta(before, after, "DB")).isEqualTo(2);
        assertThat(delta(before, after, "JS")).isEqualTo(1);
        assertThat(delta(before, after, null)).isEqualTo(1);
    }

    @Test
    void should_countActionUnderNull_when_pluginTypeMissing() {
        // Given
        Map<String, Long> before = actionCounts();
        seed(NewAction.class, new Document("unpublishedAction", new Document()));

        // When
        Map<String, Long> after = actionCounts();

        // Then
        assertThat(delta(before, after, null)).isEqualTo(1);
    }

    @Test
    void should_returnRawType_when_storedPluginTypeNotInEnum() {
        // Given
        Map<String, Long> before = actionCounts();
        seed(NewAction.class, new Document("pluginType", UNKNOWN_STORED_TYPE));

        // When
        Map<String, Long> after = actionCounts();

        // Then
        assertThat(delta(before, after, UNKNOWN_STORED_TYPE)).isEqualTo(1);
    }

    @Test
    void should_groupDatasourcesByPlugin_when_seeded() {
        // Given
        String pluginA = new ObjectId().toHexString();
        String pluginB = new ObjectId().toHexString();
        seed(Datasource.class, datasource(pluginA));
        seed(Datasource.class, datasource(pluginA));
        seed(Datasource.class, datasource(pluginB));
        seed(Datasource.class, datasource(pluginA).append("deletedAt", new Date()));
        seed(Datasource.class, datasource(pluginA).append("deleted", true));

        // When
        Map<String, Long> counts =
                datasourceRepository.countByPluginIdForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(counts).containsEntry(pluginA, 2L).containsEntry(pluginB, 1L);
    }

    @Test
    void should_returnReferencedIds_when_actionsUseDatasources() {
        // Given
        ObjectId ds1 = new ObjectId();
        ObjectId ds2 = new ObjectId();
        ObjectId ds3 = new ObjectId();
        ObjectId ds4 = new ObjectId();
        seed(NewAction.class, new Document("unpublishedAction", actionUsing(ds1)));
        seed(NewAction.class, new Document("unpublishedAction", actionUsing(ds1)));
        seed(NewAction.class, new Document("unpublishedAction", actionUsing(ds2)).append("deletedAt", new Date()));
        seed(NewAction.class, new Document("unpublishedAction", actionUsing(ds2)).append("deleted", true));
        seed(NewAction.class, new Document("unpublishedAction", actionUsing(ds3).append("deletedAt", new Date())));
        seed(NewAction.class, new Document("unpublishedAction", new Document("datasource", new Document("name", "x"))));

        // When
        Set<String> referenced = newActionRepository
                .findReferencedDatasourceIdsForDiagnostics()
                .as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(referenced).contains(ds1.toHexString());
        assertThat(referenced).doesNotContain(ds2.toHexString(), ds3.toHexString(), ds4.toHexString());
        assertThat(referenced).doesNotContainNull();
    }

    @Test
    void should_countOnlyEditableActions_when_deletionFieldsVary() {
        // Given
        Map<String, Long> before = actionCounts();
        ObjectId absent = new ObjectId();
        ObjectId explicitNull = new ObjectId();
        ObjectId deletedNull = new ObjectId();
        ObjectId beforeEpoch = new ObjectId();
        seed(
                NewAction.class,
                new Document("pluginType", "SAAS")
                        .append("deleted", null)
                        .append("unpublishedAction", actionUsing(deletedNull)));
        seed(NewAction.class, new Document("pluginType", "SAAS").append("unpublishedAction", actionUsing(absent)));
        seed(
                NewAction.class,
                new Document("pluginType", "SAAS")
                        .append("deleted", false)
                        .append("deletedAt", null)
                        .append("unpublishedAction", actionUsing(explicitNull).append("deletedAt", null)));
        seed(
                NewAction.class,
                new Document("pluginType", "SAAS")
                        .append("deletedAt", new Date(-1))
                        .append("unpublishedAction", actionUsing(beforeEpoch)));
        seed(
                NewAction.class,
                new Document("pluginType", "SAAS")
                        .append("deleted", true)
                        .append("unpublishedAction", actionUsing(beforeEpoch)));
        seed(
                NewAction.class,
                new Document("pluginType", "SAAS")
                        .append("unpublishedAction", actionUsing(beforeEpoch).append("deletedAt", new Date(-1))));

        // When
        Map<String, Long> after = actionCounts();
        Set<String> referenced = newActionRepository
                .findReferencedDatasourceIdsForDiagnostics()
                .as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(delta(before, after, "SAAS")).isEqualTo(3);
        assertThat(referenced)
                .contains(absent.toHexString(), explicitNull.toHexString(), deletedNull.toHexString())
                .doesNotContain(beforeEpoch.toHexString());
    }

    @Test
    void should_returnDatasourceId_when_oneActionIsDeletedAndAnotherIsLive() {
        // Given
        ObjectId datasourceId = new ObjectId();
        seed(
                NewAction.class,
                new Document("pluginType", "API")
                        .append("deletedAt", new Date())
                        .append("unpublishedAction", actionUsing(datasourceId)));
        seed(NewAction.class, new Document("pluginType", "DB").append("unpublishedAction", actionUsing(datasourceId)));

        // When
        Set<String> referenced = newActionRepository
                .findReferencedDatasourceIdsForDiagnostics()
                .as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(referenced).contains(datasourceId.toHexString());
    }

    @ParameterizedTest
    @MethodSource("actionAggregations")
    void should_readOnlyTheIndex_when_aggregatingActions(Aggregation aggregation) {
        // Given
        seed(
                NewAction.class,
                new Document("pluginType", "DB").append("unpublishedAction", actionUsing(new ObjectId())));
        seed(
                NewAction.class,
                new Document("pluginType", "DB")
                        .append("deletedAt", new Date())
                        .append("unpublishedAction", actionUsing(new ObjectId())));
        Document command = aggregation
                .toDocument(mongoOperations.getCollectionName(NewAction.class), Aggregation.DEFAULT_CONTEXT)
                .append("cursor", new Document())
                .append("hint", DIAGNOSTICS_EDITABLE_ACTIONS);

        // When
        Document plan = mongoOperations
                .executeCommand(new Document("explain", command).append("verbosity", "executionStats"))
                .as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        List<Number> docsExamined = valuesOf(plan, "totalDocsExamined");
        List<Number> keysExamined = valuesOf(plan, "totalKeysExamined");
        assertThat(docsExamined).isNotEmpty().allMatch(count -> count.longValue() == 0);
        assertThat(keysExamined).anyMatch(count -> count.longValue() > 0);
    }

    private static Stream<Aggregation> actionAggregations() {
        return Stream.of(
                CustomNewActionRepositoryCEImpl.editableByPluginTypeAggregation(),
                CustomNewActionRepositoryCEImpl.referencedDatasourceIdsAggregation());
    }

    /** Collects every number stored under {@code key}, at any depth. */
    private static List<Number> valuesOf(Object node, String key) {
        List<Number> values = new ArrayList<>();
        if (node instanceof Document document) {
            document.forEach((name, value) -> {
                if (name.equals(key) && value instanceof Number number) {
                    values.add(number);
                }
                values.addAll(valuesOf(value, key));
            });
        } else if (node instanceof List<?> list) {
            list.forEach(item -> values.addAll(valuesOf(item, key)));
        }
        return values;
    }

    @Test
    void should_countReferencedDeletedDatasourceAsMissing_when_dsDeleted() {
        // Given
        String pluginId = new ObjectId().toHexString();
        ObjectId ds5 = seed(Datasource.class, datasource(pluginId).append("deletedAt", new Date()));
        seed(NewAction.class, new Document("unpublishedAction", actionUsing(ds5)));

        // When
        Map<String, Long> counts = datasourceRepository
                .countByPluginIdForDiagnostics(Set.of(ds5.toHexString()))
                .as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(counts).isEmpty();
    }

    @Test
    void should_countOnlyGivenIds_when_idSetProvided() {
        // Given
        String pluginId = new ObjectId().toHexString();
        ObjectId inSet = seed(Datasource.class, datasource(pluginId));
        seed(Datasource.class, datasource(pluginId));

        // When
        Map<String, Long> counts = datasourceRepository
                .countByPluginIdForDiagnostics(Set.of(inSet.toHexString(), "not-an-object-id"))
                .as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(counts).containsEntry(pluginId, 1L);
    }

    @Test
    void should_returnEmptyMap_when_idSetEmpty() {
        // Given
        Set<String> noIds = Set.of();

        // When
        Map<String, Long> counts =
                datasourceRepository.countByPluginIdForDiagnostics(noIds).as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(counts).isEmpty();
    }

    @Test
    void should_countUsersExcludingSystemAndDeleted_when_seeded() {
        // Given
        long before = userRepository.countForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        seed(User.class, user());
        seed(User.class, user().append("isSystemGenerated", false));
        seed(User.class, user().append("isSystemGenerated", true));
        seed(User.class, user().append("deletedAt", new Date()));
        seed(User.class, user().append("deleted", true));

        // When
        long after = userRepository.countForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(after - before).isEqualTo(2);
    }

    @Test
    void should_countUnrevokedKeys_when_someRevokedOrDeleted() {
        // Given
        long before = mcpKeyRepository.countActiveForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
        seed(McpKey.class, mcpKey());
        seed(McpKey.class, mcpKey());
        seed(McpKey.class, mcpKey().append("revokedAt", null));
        seed(McpKey.class, mcpKey().append("revokedAt", new Date()));
        seed(McpKey.class, mcpKey().append("deletedAt", new Date()));
        seed(McpKey.class, mcpKey().append("deleted", true));

        // When
        long after = mcpKeyRepository.countActiveForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);

        // Then
        assertThat(after - before).isEqualTo(3);
    }

    private static Document mcpKey() {
        return new Document("userId", new ObjectId().toHexString())
                .append("name", "diagnostics-test-" + new ObjectId())
                .append("keySpanDays", 30);
    }

    /** A unique email and organization keep the seeded documents clear of the unique index on users. */
    private static Document user() {
        return new Document("email", "diagnostics-test-" + new ObjectId() + "@example.com")
                .append("organizationId", new ObjectId().toHexString());
    }

    /** A unique workspace and name keep the seeded documents clear of the unique index on datasources. */
    private static Document datasource(String pluginId) {
        return new Document("pluginId", pluginId)
                .append("workspaceId", new ObjectId().toHexString())
                .append("name", "diagnostics-test-" + new ObjectId());
    }

    private static Document actionUsing(ObjectId datasourceId) {
        return new Document("datasource", new Document("_id", datasourceId));
    }

    /** Verifies that {@code mono} emits one value within 10 seconds and returns it. */
    private static <T> T verified(Mono<T> mono) {
        AtomicReference<T> value = new AtomicReference<>();
        StepVerifier.create(mono).consumeNextWith(value::set).expectComplete().verify(Duration.ofSeconds(10));
        return value.get();
    }

    private ApplicationDiagnosticsCounts applicationCounts() {
        return applicationRepository.countForDiagnostics().as(DiagnosticsCountsRepositoryTest::verified);
    }

    private Map<String, Long> actionCounts() {
        return newActionRepository
                .countEditableByPluginTypeForDiagnostics()
                .collectMap(
                        document -> document.get("_id") == null
                                ? null
                                : document.get("_id").toString(),
                        document -> ((Number) document.get("count")).longValue(),
                        HashMap::new)
                .as(DiagnosticsCountsRepositoryTest::verified);
    }

    private static long delta(Map<String, Long> before, Map<String, Long> after, String key) {
        return after.getOrDefault(key, 0L) - before.getOrDefault(key, 0L);
    }

    private static Document app() {
        return new Document("name", "diagnostics-test-" + new ObjectId());
    }

    private static Document git(String defaultBranchName, String branchName, boolean withAuth) {
        Document metadata = new Document("defaultBranchName", defaultBranchName).append("branchName", branchName);
        if (withAuth) {
            metadata.append("gitAuth", new Document("publicKey", "test-key"));
        }
        return metadata;
    }

    private ObjectId seed(Class<?> domain, Document document) {
        ObjectId id = new ObjectId();
        document.append("_id", id);
        String collection = mongoOperations.getCollectionName(domain);
        mongoOperations.insert(document, collection).block();
        seeded.computeIfAbsent(collection, ignored -> new ArrayList<>()).add(id);
        return id;
    }
}
