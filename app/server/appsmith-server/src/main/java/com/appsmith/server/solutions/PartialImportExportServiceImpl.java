package com.appsmith.server.solutions;

import com.appsmith.server.solutions.ce.PartialImportExportServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Primary
public class PartialImportExportServiceImpl extends PartialImportExportServiceCEImpl
implements PartialImportExportService{

    public PartialImportExportServiceImpl(
            ImportExportApplicationService importExportApplicationService
    ) {
        super(
                importExportApplicationService
        );
    }

}
