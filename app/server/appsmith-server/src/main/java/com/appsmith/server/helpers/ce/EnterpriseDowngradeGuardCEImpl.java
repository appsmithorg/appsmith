package com.appsmith.server.helpers.ce;

import com.mongodb.client.model.Filters;
import com.mongodb.reactivestreams.client.MongoClient;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.conversions.Bson;
import reactor.core.publisher.Mono;

import java.util.regex.Pattern;

@Slf4j
public class EnterpriseDowngradeGuardCEImpl implements EnterpriseDowngradeGuardCE {

    // How EE migrations are distinguished from CE migrations in the Mongock audit log:
    //   - CE migrations live in the "...migrations.db.ce." subpackage
    //     (e.g. com.appsmith.server.migrations.db.ce.Migration003...).
    //   - EE migrations live in the PARENT "...migrations.db." package and carry an "EE" token in
    //     their class name (e.g. com.appsmith.server.migrations.db.Migration003EE01...).
    //   - The legacy EE changelog class "...migrations.DatabaseChangelogEE" predates the db package.
    // So a changeLogClass under "...migrations.db." that is NOT under "...migrations.db.ce." was
    // written by EE. Verified against the appsmith-ee repo: 69 EE @ChangeUnit classes, all directly
    // in the parent package; CE has zero classes directly in that package (all CE ones are in db.ce).
    // (The earlier ".db.ee." prefix was wrong — EE has no such package — so the guard never fired.)
    static final String MIGRATIONS_DB_PACKAGE_PREFIX = "com.appsmith.server.migrations.db.";
    static final String CE_MIGRATIONS_DB_PACKAGE_PREFIX = "com.appsmith.server.migrations.db.ce.";
    static final String LEGACY_EE_CHANGELOG_CLASS = "com.appsmith.server.migrations.DatabaseChangelogEE";

    /**
     * Thrown to abort CE startup when the connected database was previously used by Appsmith
     * Enterprise Edition (EE). Aborting via a thrown {@link RuntimeException} during bean creation
     * matches the local convention in {@code MongoConfig} (see {@code checkForbiddenIds}).
     */
    public static class EnterpriseDowngradeException extends RuntimeException {
        public EnterpriseDowngradeException(String message) {
            super(message);
        }
    }

    @Override
    public void assertNotEnterpriseDatabase(MongoClient mongoClient, String databaseName) {
        // Mongock v5 records every applied (or failed) changeset in this default audit collection
        // (the matching lock collection is "mongockLock"). A document whose "changeLogClass" starts
        // with the EE migration package proves EE ran against this database.
        Document eeChangeLog;
        try {
            // EE = a migration recorded in the parent "...migrations.db." package but NOT in the CE
            // "...migrations.db.ce." subpackage, OR the legacy EE changelog class. Prefixes are
            // anchored and escaped via Pattern.quote so only exact package segments match.
            // Note: $not(regex) also matches docs where changeLogClass is absent/non-string, but it is
            // AND-ed with the positive parent-package regex (which requires a present, matching string),
            // so the negation only ever excludes the db.ce subset. Do not split these two clauses.
            final Bson filter = Filters.or(
                    Filters.and(
                            Filters.regex("changeLogClass", "^" + Pattern.quote(MIGRATIONS_DB_PACKAGE_PREFIX)),
                            Filters.not(Filters.regex(
                                    "changeLogClass", "^" + Pattern.quote(CE_MIGRATIONS_DB_PACKAGE_PREFIX)))),
                    Filters.eq("changeLogClass", LEGACY_EE_CHANGELOG_CLASS));
            // No "state" filter: a FAILED/partial EE migration still proves EE ran against this DB.
            // Blocking is acceptable here: this is one-time startup config code and Mongock's own
            // initialization (which runs immediately after) already blocks at this point.
            eeChangeLog = Mono.from(mongoClient
                            .getDatabase(databaseName)
                            .getCollection("mongockChangeLog")
                            .find(filter)
                            .limit(1)
                            .first())
                    .block();
        } catch (Exception e) {
            // Fail OPEN on infrastructure error: the signal is positive, so EE evidence must be
            // affirmatively found to justify a hard stop. Treating "couldn't read" as "is EE" would
            // brick CE operators with a flaky/locked-down Mongo. Mongock runs immediately after and
            // will itself fail loudly if Mongo is genuinely unreachable.
            log.warn("Could not run EE->CE downgrade check; proceeding", e);
            return;
        }

        // Detection-abort lives OUTSIDE the catch above so the fail-open handler can never swallow it.
        if (eeChangeLog != null) {
            final String changeId = stripCrLf(eeChangeLog.getString("changeId"));
            final String changeLogClass = stripCrLf(eeChangeLog.getString("changeLogClass"));

            // Log the operator-facing banner FIRST so it is the last thing printed before the
            // framework's BeanCreationException stack trace. CR/LF-stripped, parameterized values
            // avoid log forging.
            log.error(
                    """

                            ################################################################
                            APPSMITH STARTUP ABORTED  [APPSMITH-EE-DOWNGRADE-BLOCKED]
                            Enterprise -> Community (EE -> CE) downgrade detected.
                            This database was previously used by Appsmith Enterprise Edition (EE).
                            Detected EE migration record in 'mongockChangeLog':
                              changeId       = {}
                              changeLogClass = {}
                            Running Community Edition (CE) against an EE database is not supported and can
                            corrupt your data. Startup has been stopped to protect the database.
                            Supported paths forward: run an Appsmith EE build against this database, or
                            restore a CE backup taken before EE was used.
                            See: https://docs.appsmith.com/
                            ################################################################
                            """,
                    changeId,
                    changeLogClass);
            // TODO(docs): replace the placeholder URL above with the runbook URL for the
            // APPSMITH-EE-DOWNGRADE-BLOCKED token once the docs team supplies it.

            throw new EnterpriseDowngradeException(
                    "EE -> CE downgrade detected; startup aborted to protect the database.");
        }
    }

    private static String stripCrLf(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("[\\r\\n]", "");
    }
}
