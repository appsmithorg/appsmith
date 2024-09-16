package com.appsmith.git.files.operations;

import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.fasterxml.jackson.core.PrettyPrinter;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Primary
@Component
public class FileOperationsImpl extends FileOperationsCEv2Impl implements FileOperations {
    public FileOperationsImpl(PrettyPrinter prettyPrinter, ObservationHelper observationHelper) {
        super(prettyPrinter, observationHelper);
    }
}
