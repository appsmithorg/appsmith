package com.appsmith.server.services.ce;

import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class TestServiceCEImpl implements TestService {

    private final AnalyticsService analyticsService;

    @Override
    public String ce_ee_same_impl_method() {
        return "ce_ee_same_impl_method_calling_from_ce_class";
    }

    @Override
    public String ce_ee_same_diff_method() {
        return "ce_ee_same_diff_method_calling_from_ce_class";
    }
}
