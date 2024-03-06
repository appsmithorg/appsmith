package com.appsmith.server.services.ce_compatible;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.dtos.AuditLogFilterDTO;
import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Implementation of the {@link AuditLogServiceCECompatible} interface.
 * This service ensures compatibility for audit logging functionality in cases where the corresponding feature flag,
 * {@link com.appsmith.server.featureflags.FeatureFlagEnum}.license_audit_logs_enabled, is not supported.
 */
@Service
public class AuditLogServiceCECompatibleImpl implements AuditLogServiceCECompatible {

    @Override
    public Mono<AuditLog> logEvent(AnalyticsEvents event, Object resource, Map<String, Object> properties) {
        return Mono.empty();
    }

    @Override
    public Mono<List<AuditLog>> getAuditLogs(MultiValueMap<String, String> params) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<AuditLogFilterDTO> getAuditLogFilterData() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ExportFileDTO> exportAuditLogs(MultiValueMap<String, String> params) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<String>> getAllUsers() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
