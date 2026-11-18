package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.collectors.DiagnosticsCollector;
import com.appsmith.server.diagnostics.dtos.DiagnosticsDownloadRequest;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionResult;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionsResponse;
import com.appsmith.server.diagnostics.dtos.DiagnosticsStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Slf4j
public class SupportDiagnosticsServiceCEImpl implements SupportDiagnosticsServiceCE {

    private final UserUtils userUtils;
    private final SessionUserService sessionUserService;
    private final DiagnosticsResultStore resultStore;
    private final DiagnosticsRedactionGuard redactionGuard;
    private final Map<DiagnosticsSectionId, DiagnosticsCollector> collectors =
            new EnumMap<>(DiagnosticsSectionId.class);

    public SupportDiagnosticsServiceCEImpl(
            UserUtils userUtils,
            SessionUserService sessionUserService,
            DiagnosticsResultStore resultStore,
            DiagnosticsRedactionGuard redactionGuard,
            List<DiagnosticsCollector> collectors) {
        this.userUtils = userUtils;
        this.sessionUserService = sessionUserService;
        this.resultStore = resultStore;
        this.redactionGuard = redactionGuard;
        collectors.forEach(collector -> {
            DiagnosticsCollector existing = this.collectors.putIfAbsent(collector.sectionId(), collector);
            if (existing != null) {
                throw new IllegalStateException("Two support diagnostics collectors report section "
                        + collector.sectionId() + ": " + existing.getClass().getName() + " and "
                        + collector.getClass().getName());
            }
        });
    }

    /**
     * Support diagnostics cover one organization. CE and single-org EE return false. Multi-org EE returns true, and
     * every endpoint then fails with {@link AppsmithError#UNSUPPORTED_OPERATION}.
     */
    protected Mono<Boolean> isMultiOrgInstance() {
        return Mono.just(false);
    }

    @Override
    public Mono<DiagnosticsSectionsResponse> listSections() {
        return checkAccessAndGetOrganizationId().flatMap(organizationId -> Flux.fromArray(DiagnosticsSectionId.values())
                .flatMapSequential(sectionId -> collectors.containsKey(sectionId)
                        ? resultStore
                                .get(organizationId, sectionId)
                                .filter(result -> result.status() != DiagnosticsStatus.NOT_SUPPORTED)
                                .switchIfEmpty(
                                        Mono.fromSupplier(() -> DiagnosticsSectionResult.notCollected(sectionId)))
                        : Mono.just(DiagnosticsSectionResult.notSupported(sectionId)))
                .collectList()
                .map(sections -> new DiagnosticsSectionsResponse(COLLECTOR_VERSION, sections)));
    }

    @Override
    public Mono<DiagnosticsSectionResult> collect(DiagnosticsSectionId sectionId) {
        return checkAccessAndGetOrganizationId().flatMap(organizationId -> {
            DiagnosticsCollector collector = collectors.get(sectionId);
            if (collector == null) {
                return Mono.just(DiagnosticsSectionResult.notSupported(sectionId));
            }
            return resultStore.tryLock(organizationId, sectionId).flatMap(outcome -> switch (outcome) {
                case HELD -> Mono.error(new AppsmithException(AppsmithError.TOO_MANY_REQUESTS));
                // Redis did not confirm the lock, so another request's lock may be the one in place.
                case UNCONFIRMED -> runCollector(organizationId, collector);
                case ACQUIRED ->
                    Mono.usingWhen(
                            Mono.just(organizationId),
                            id -> runCollector(id, collector),
                            id -> resultStore.unlock(id, sectionId));
            });
        });
    }

    @Override
    public Mono<Void> recordDownload(DiagnosticsDownloadRequest request) {
        return checkAccessAndGetOrganizationId()
                .doOnNext(organizationId -> log.info(
                        "Support diagnostics download requested for organization {}, sections {}, encrypted {}",
                        organizationId,
                        request.sectionIds(),
                        request.encrypted()))
                .then();
    }

    private Mono<String> checkAccessAndGetOrganizationId() {
        return userUtils
                .isCurrentUserSuperUser()
                .defaultIfEmpty(false)
                .flatMap(isSuperUser -> {
                    if (!Boolean.TRUE.equals(isSuperUser)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }
                    return isMultiOrgInstance().defaultIfEmpty(true);
                })
                .flatMap(isMultiOrg -> {
                    if (Boolean.TRUE.equals(isMultiOrg)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    return sessionUserService
                            .getCurrentUser()
                            .flatMap(user -> Mono.justOrEmpty(user.getOrganizationId()))
                            .filter(StringUtils::hasText)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)));
                });
    }

    private Mono<DiagnosticsSectionResult> runCollector(String organizationId, DiagnosticsCollector collector) {
        DiagnosticsSectionId sectionId = collector.sectionId();
        return Mono.defer(collector::collect)
                .timeout(COLLECT_TIMEOUT)
                .map(data -> redactionGuard
                        .violation(collector.allowedKeys(), data)
                        .map(code -> DiagnosticsSectionResult.unavailable(sectionId, code))
                        .orElseGet(() -> DiagnosticsSectionResult.ok(sectionId, data, Instant.now())))
                .switchIfEmpty(Mono.fromSupplier(() -> {
                    log.warn("Support diagnostics collector returned no data for section {}", sectionId);
                    return DiagnosticsSectionResult.unavailable(sectionId, "collector_failed");
                }))
                .onErrorResume(error -> {
                    if (error instanceof TimeoutException) {
                        log.warn("Support diagnostics collector timed out for section {}", sectionId);
                        return Mono.just(DiagnosticsSectionResult.unavailable(sectionId, "timeout"));
                    }
                    log.warn(
                            "Support diagnostics collector failed for section {} with {}",
                            sectionId,
                            error.getClass().getName());
                    return Mono.just(DiagnosticsSectionResult.unavailable(sectionId, "collector_failed"));
                })
                .flatMap(result -> isStorable(result)
                        ? resultStore.put(organizationId, result).thenReturn(result)
                        : Mono.just(result));
    }

    private static boolean isStorable(DiagnosticsSectionResult result) {
        return result.status() == DiagnosticsStatus.OK;
    }
}
