package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.OrganizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;
import java.util.stream.Stream;

/**
 * Reports which login methods are on, whether signup is disabled, and the user count. In EE, it also reports whether
 * OIDC and SAML are configured, the SAML engine and migration status, the SCIM status, and the group and custom role
 * counts. It reports presence only: never a client ID, a provider name or a SAML detail.
 *
 * <p>Each CE read has its own time limit, so a slow read reports {@code UNKNOWN} for its own keys only.
 */
@Slf4j
public class IdentityDiagnosticsCollectorCE implements DiagnosticsCollector {

    protected static final List<String> EE_KEYS = List.of(
            "oidcConfigured",
            "samlConfigured",
            "samlEngine",
            "samlMigrationStatus",
            "scimStatus",
            "provisionedUsers",
            "provisionedGroups",
            "groups",
            "customRoles",
            "auditLogsEntitled");

    /** The nested keys of {@code loginMethods}. */
    protected static final List<String> LOGIN_METHODS = List.of("form", "google", "github");

    /** The SAML engines EE reports. Any other engine reports {@code other}. */
    protected static final Set<String> SAML_ENGINES = Set.of("keycloak", "native");

    /** The constant names of the EE {@code SamlMigrationState.Status} enum. CE has no such enum, so they are literals. */
    protected static final Set<String> SAML_MIGRATION_STATUSES = Set.of(
            "NOT_CONFIGURED",
            "SYNC_PENDING",
            "SYNCED",
            "ACTION_REQUIRED",
            "NATIVE_OPT_IN",
            "NATIVE_VERIFIED",
            "FAILED",
            "ROLLED_BACK");

    /** The SCIM provisioning statuses EE reports. Any other status reports {@code other}. */
    protected static final Set<String> SCIM_STATUSES = Set.of("active", "inactive");

    static final String GOOGLE_CLIENT_ID = "APPSMITH_OAUTH2_GOOGLE_CLIENT_ID";
    static final String GITHUB_CLIENT_ID = "APPSMITH_OAUTH2_GITHUB_CLIENT_ID";

    private static final DiagnosticsSchema SCHEMA = DiagnosticsSchema.builder()
            .map("loginMethods", Set.copyOf(LOGIN_METHODS))
            .key("signupDisabled", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("users", DiagnosticsSchema.ValueKind.COUNT)
            .key("oidcConfigured", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("samlConfigured", DiagnosticsSchema.ValueKind.BOOLEAN)
            .category("samlEngine", withOther(SAML_ENGINES))
            .category("samlMigrationStatus", withOther(SAML_MIGRATION_STATUSES))
            .category("scimStatus", withOther(SCIM_STATUSES))
            .key("provisionedUsers", DiagnosticsSchema.ValueKind.COUNT)
            .key("provisionedGroups", DiagnosticsSchema.ValueKind.COUNT)
            .key("groups", DiagnosticsSchema.ValueKind.COUNT)
            .key("customRoles", DiagnosticsSchema.ValueKind.COUNT)
            .key("auditLogsEntitled", DiagnosticsSchema.ValueKind.BOOLEAN)
            .build();

    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final Function<String, String> environment;

    @Autowired
    public IdentityDiagnosticsCollectorCE(UserRepository userRepository, OrganizationService organizationService) {
        this(userRepository, organizationService, System::getenv);
    }

    IdentityDiagnosticsCollectorCE(
            UserRepository userRepository,
            OrganizationService organizationService,
            Function<String, String> environment) {
        this.userRepository = userRepository;
        this.organizationService = organizationService;
        this.environment = environment;
    }

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.IDENTITY;
    }

    @Override
    public DiagnosticsSchema schema() {
        return SCHEMA;
    }

    @Override
    public Mono<Map<String, Object>> collect(String organizationId) {
        Mono<Optional<OrganizationConfiguration>> configuration = boundedRead(
                "organization",
                Mono.defer(() -> organizationService.retrieveById(organizationId))
                        .map(organization -> Optional.ofNullable(organization.getOrganizationConfiguration())),
                Optional.empty());
        Mono<Object> users =
                boundedRead("users", Mono.defer(userRepository::countForDiagnostics), DiagnosticsValues.UNKNOWN);

        Mono<Map<String, Object>> ceData = Mono.zip(configuration, users).map(parts -> {
            OrganizationConfiguration config = parts.getT1().orElse(null);
            Map<String, Object> loginMethods = new LinkedHashMap<>();
            loginMethods.put(
                    "form",
                    config == null ? DiagnosticsValues.UNKNOWN : !Boolean.FALSE.equals(config.getIsFormLoginEnabled()));
            loginMethods.put("google", hasEnvironmentValue(GOOGLE_CLIENT_ID));
            loginMethods.put("github", hasEnvironmentValue(GITHUB_CLIENT_ID));

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("loginMethods", loginMethods);
            data.put(
                    "signupDisabled",
                    config == null ? DiagnosticsValues.UNKNOWN : Boolean.TRUE.equals(config.getIsSignupDisabled()));
            data.put("users", parts.getT2());
            return data;
        });

        // The EE stage starts with the CE reads, so both share the section time limit.
        return DiagnosticsEeFields.merge(ceData, () -> eeFields(organizationId), EE_KEYS, "identity");
    }

    /**
     * The values of the EE-only keys in {@link #EE_KEYS}. CE does not support them.
     */
    protected Mono<Map<String, Object>> eeFields(String organizationId) {
        return Mono.just(DiagnosticsValues.allNotSupported(EE_KEYS));
    }

    /** @return whether the environment variable {@code name} has text. Its value is never returned. */
    protected boolean hasEnvironmentValue(String name) {
        return StringUtils.hasText(environment.apply(name));
    }

    /** Loads the organization, for an EE override that needs more of it than the CE keys. */
    protected Mono<Organization> organization(String organizationId) {
        return organizationService.retrieveById(organizationId);
    }

    /**
     * Bounds one CE read by {@link DiagnosticsValues#EE_READ_TIMEOUT}. An error, an empty result, or no result in time
     * gives {@code fallback}, so only the keys this read feeds lose their values. The log names the read and the error
     * class only. A timeout logs at debug level and any other error at warn level, so a broken read stays visible.
     */
    private static <T> Mono<T> boundedRead(String key, Mono<? extends T> read, T fallback) {
        Mono<T> value = read.map(result -> result);
        return value.timeout(DiagnosticsValues.EE_READ_TIMEOUT)
                .onErrorResume(error -> {
                    if (error instanceof TimeoutException) {
                        log.debug(
                                "Support diagnostics identity read {} timed out with {}",
                                key,
                                error.getClass().getName());
                    } else {
                        log.warn(
                                "Support diagnostics identity read {} failed with {}",
                                key,
                                error.getClass().getName());
                    }
                    return Mono.just(fallback);
                })
                .defaultIfEmpty(fallback);
    }

    private static String[] withOther(Set<String> values) {
        return Stream.concat(values.stream(), Stream.of(DiagnosticsValues.OTHER))
                .toArray(String[]::new);
    }
}
