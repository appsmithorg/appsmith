package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.collectors.DiagnosticsCollector;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.SessionUserService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupportDiagnosticsServiceImpl extends SupportDiagnosticsServiceCEImpl
        implements SupportDiagnosticsService {

    public SupportDiagnosticsServiceImpl(
            UserUtils userUtils,
            SessionUserService sessionUserService,
            DiagnosticsResultStore resultStore,
            DiagnosticsRedactionGuard redactionGuard,
            List<DiagnosticsCollector> collectors) {
        super(userUtils, sessionUserService, resultStore, redactionGuard, collectors);
    }
}
