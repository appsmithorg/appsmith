package com.appsmith.git.files.operations;

import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import com.fasterxml.jackson.core.PrettyPrinter;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@Import({GitServiceConfig.class})
public class FileOperationsImpl extends FileOperationsCEv2Impl implements FileOperations {
    public FileOperationsImpl(PrettyPrinter prettyPrinter, ObservationHelper observationHelper) {
        super(prettyPrinter, observationHelper);
    }
}
