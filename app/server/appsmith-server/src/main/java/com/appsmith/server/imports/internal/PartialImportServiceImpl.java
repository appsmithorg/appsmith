package com.appsmith.server.imports.internal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Primary
public class PartialImportServiceImpl extends PartialImportServiceCEImpl implements PartialImportService {

    public PartialImportServiceImpl(ImportApplicationService importApplicationService) {
        super(importApplicationService);
    }
}
