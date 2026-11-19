package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationDiagnosticsCounts;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
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
