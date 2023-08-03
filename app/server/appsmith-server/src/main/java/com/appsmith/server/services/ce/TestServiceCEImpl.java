package com.appsmith.server.services.ce;

import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class TestServiceCEImpl implements TestService {

    private final AnalyticsService analyticsService;

    private final FeatureFlagService featureFlagService;

    @Override
    public Mono<String> ce_ee_same_impl_method() {
        return featureFlagService
                .check(FeatureFlagEnum.release_test_service_flag)
                .map(isSupported -> Boolean.TRUE.equals(isSupported)
                        ? "ce_ee_same_impl_method_calling_from_ce_class_ff_supported"
                        : "ce_ee_same_impl_method_calling_from_ce_class_ff_unsupported");
    }

    @Override
    public String ce_ee_same_diff_method() {
        return "ce_ee_same_diff_method_calling_from_ce_class";
    }
}
