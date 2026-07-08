package com.appsmith.server.helpers.ce;

import com.mongodb.MongoCommandException;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoCollection;
import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.mongo.MongoProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests for {@link EnterpriseDowngradeGuardCEImpl} (the CE implementation of the EE -> CE downgrade
 * guard). Each case seeds the real Mongock audit collection ("mongockChangeLog") in the embedded
 * flapdoodle Mongo, runs the guard against the same reactive {@link MongoClient} bean that
 * {@code MongoConfig} uses, and asserts whether startup would be aborted.
 */
@SpringBootTest
@ActiveProfiles("test")
public class EnterpriseDowngradeGuardCEImplTest {

    private static final String MONGOCK_CHANGE_LOG = "mongockChangeLog";

    @Autowired
    private MongoClient mongoClient;

    @Autowired
    private MongoProperties mongoProperties;

    // Test the CE implementation directly. The bean wired into MongoConfig is the EE-overridable
    // EnterpriseDowngradeGuard; this class verifies the CE behaviour explicitly.
    private final EnterpriseDowngradeGuardCEImpl guard = new EnterpriseDowngradeGuardCEImpl();

    private String databaseName;

    private MongoCollection<Document> changeLogCollection() {
        return mongoClient.getDatabase(databaseName).getCollection(MONGOCK_CHANGE_LOG);
    }

    private void clearChangeLog() {
        // deleteMany on a missing collection is a no-op; safe regardless of prior state.
        Mono.from(changeLogCollection().deleteMany(new Document())).block();
    }

    private void seed(List<Document> docs) {
        Flux.fromIterable(docs)
                .flatMap(doc -> Mono.from(changeLogCollection().insertOne(doc)))
                .blockLast();
    }

    private void runGuard() {
        guard.assertNotEnterpriseDatabase(mongoClient, databaseName);
    }

    @BeforeEach
    public void setUp() {
        // Same database name resolution that MongoConfig uses to drive Mongock.
        databaseName = mongoProperties.getMongoClientDatabase();
        clearChangeLog();
    }

    @AfterEach
    public void cleanUp() {
        // Drop the collection so no seeded audit record leaks into other tests in the context.
        Mono.from(changeLogCollection().drop()).block();
    }

    private Document changeLog(String changeId, String changeLogClass) {
        return new Document().append("changeId", changeId).append("changeLogClass", changeLogClass);
    }

    private Document changeLog(String changeId, String changeLogClass, String state) {
        return changeLog(changeId, changeLogClass).append("state", state);
    }

    // Case 1: A real EE migration record present (EE class in the parent migrations.db package)
    // -> guard throws EnterpriseDowngradeException. Class name matches the actual appsmith-ee
    // convention "...migrations.db.MigrationNNNEEnn...".
    @Test
    public void assertNotEnterpriseDatabase_whenEeMigrationRecordPresent_throws() {
        seed(List.of(changeLog(
                "add-delete-user-policy",
                "com.appsmith.server.migrations.db.Migration003EE01AddDeleteUserPolicyToAllUsersAndAddTenantPolicyToDefaultTenant",
                "EXECUTED")));

        assertThatThrownBy(this::runGuard)
                .isInstanceOf(EnterpriseDowngradeGuardCEImpl.EnterpriseDowngradeException.class);
    }

    // Case 1b: The legacy EE changelog class "...migrations.DatabaseChangelogEE" -> guard throws.
    @Test
    public void assertNotEnterpriseDatabase_whenLegacyEeChangelogPresent_throws() {
        seed(List.of(changeLog("ee-legacy", "com.appsmith.server.migrations.DatabaseChangelogEE", "EXECUTED")));

        assertThatThrownBy(this::runGuard)
                .isInstanceOf(EnterpriseDowngradeGuardCEImpl.EnterpriseDowngradeException.class);
    }

    // Case 2: Only CE migration classes (db.ce subpackage + legacy DatabaseChangelog0/1/2)
    // -> does NOT throw. These are exactly the classes a CE-only database contains.
    @Test
    public void assertNotEnterpriseDatabase_whenOnlyCeMigrationRecordsPresent_doesNotThrow() {
        seed(List.of(
                changeLog(
                        "ce-migration-003",
                        "com.appsmith.server.migrations.db.ce.Migration003AddInstanceNameToTenantConfiguration",
                        "EXECUTED"),
                changeLog("legacy-changelog-0", "com.appsmith.server.migrations.DatabaseChangelog0", "EXECUTED"),
                changeLog("legacy-changelog-2", "com.appsmith.server.migrations.DatabaseChangelog2", "EXECUTED")));

        assertThatCode(this::runGuard).doesNotThrowAnyException();
    }

    // Case 3: Empty mongockChangeLog collection -> does NOT throw.
    @Test
    public void assertNotEnterpriseDatabase_whenChangeLogEmpty_doesNotThrow() {
        // Ensure the collection exists but is empty. Ignore only the "collection already exists"
        // error (NamespaceExists, code 48); any other failure indicates broken setup and must surface.
        Mono.from(mongoClient.getDatabase(databaseName).createCollection(MONGOCK_CHANGE_LOG))
                .onErrorResume(
                        e -> e instanceof MongoCommandException mce && mce.getErrorCode() == 48, e -> Mono.empty())
                .block();
        clearChangeLog();

        assertThatCode(this::runGuard).doesNotThrowAnyException();
    }

    // Case 4: Missing mongockChangeLog collection (dropped) -> does NOT throw.
    @Test
    public void assertNotEnterpriseDatabase_whenChangeLogCollectionMissing_doesNotThrow() {
        Mono.from(changeLogCollection().drop()).block();

        assertThatCode(this::runGuard).doesNotThrowAnyException();
    }

    // Case 5: EE record with state "FAILED" -> still throws (detection is state-agnostic).
    @Test
    public void assertNotEnterpriseDatabase_whenEeMigrationFailed_stillThrows() {
        seed(List.of(changeLog(
                "ee-failed", "com.appsmith.server.migrations.db.Migration042EE01AddWorkflowPlugin", "FAILED")));

        assertThatThrownBy(this::runGuard)
                .isInstanceOf(EnterpriseDowngradeGuardCEImpl.EnterpriseDowngradeException.class);
    }

    // Case 6: CE-package near misses -> does NOT throw. These must NOT be mistaken for EE:
    //   - "...db.ce.EeThing"  lives under the CE package and contains "Ee" in its name.
    //   - "...db.ce.Migration075..." is a normal CE migration in the db.ce subpackage.
    // Proves detection excludes the db.ce subpackage rather than naively matching "db." or "EE".
    @Test
    public void assertNotEnterpriseDatabase_whenCePackageNearMisses_doesNotThrow() {
        seed(List.of(
                changeLog("ce-eething", "com.appsmith.server.migrations.db.ce.EeThing", "EXECUTED"),
                changeLog(
                        "ce-migration-075",
                        "com.appsmith.server.migrations.db.ce.Migration075SeedSuperUserSetupLock",
                        "EXECUTED")));

        assertThatCode(this::runGuard).doesNotThrowAnyException();
    }

    // Case 7: A mixed CE + EE database (the real downgrade scenario) -> throws. An EE record alongside
    // many CE records must still trip the guard.
    @Test
    public void assertNotEnterpriseDatabase_whenCeAndEeRecordsMixed_throws() {
        seed(List.of(
                changeLog(
                        "ce-migration-003",
                        "com.appsmith.server.migrations.db.ce.Migration003AddInstanceNameToTenantConfiguration",
                        "EXECUTED"),
                changeLog(
                        "ee-add-workflow-plugin",
                        "com.appsmith.server.migrations.db.Migration042EE01AddWorkflowPlugin",
                        "EXECUTED")));

        assertThatThrownBy(this::runGuard)
                .isInstanceOf(EnterpriseDowngradeGuardCEImpl.EnterpriseDowngradeException.class);
    }
}
