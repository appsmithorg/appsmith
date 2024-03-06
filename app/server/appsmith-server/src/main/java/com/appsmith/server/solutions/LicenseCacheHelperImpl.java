package com.appsmith.server.solutions;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class LicenseCacheHelperImpl implements LicenseCacheHelper {
    private final TenantRepository tenantRepository;
    private final Map<String, License> licenseCache = new HashMap<>();
    private static final String defaultTenantId = "defaultTenantId";

    @Override
    public Mono<License> get(String tenantId) {
        if (licenseCache.containsKey(tenantId)) {
            return Mono.just(licenseCache.get(tenantId));
        }
        return Mono.empty();
    }

    @Override
    public Mono<License> getDefault() {
        if (licenseCache.containsKey(defaultTenantId)) {
            return get(defaultTenantId);
        }
        return getDefaultTenant().flatMap(tenant -> {
            License license;

            if (tenant == null
                    || tenant.getTenantConfiguration() == null
                    || tenant.getTenantConfiguration().getLicense() == null) {
                // place empty license if not present
                license = new License();
            } else {
                license = tenant.getTenantConfiguration().getLicense();
            }
            return put(defaultTenantId, license);
        });
    }

    private Mono<Tenant> getDefaultTenant() {
        return tenantRepository.findBySlug(FieldName.DEFAULT);
    }

    @Override
    public Mono<License> put(String tenantId, License license) {
        // cloning license copy to avoid source license field update lead to cache objects updates
        License licenseCopy = new License();
        AppsmithBeanUtils.copyNestedNonNullProperties(license, licenseCopy);
        licenseCache.put(tenantId, licenseCopy);
        return Mono.just(license);
    }

    @Override
    public Mono<License> remove(String tenantId) {
        if (licenseCache.containsKey(tenantId)) {
            return Mono.just(licenseCache.remove(tenantId));
        }
        return Mono.empty();
    }
}
