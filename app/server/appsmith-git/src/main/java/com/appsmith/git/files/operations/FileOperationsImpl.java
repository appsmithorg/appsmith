package com.appsmith.git.files.operations;

import com.appsmith.external.git.GitExecutor;
import com.appsmith.external.git.operations.FileOperations;
import com.appsmith.external.helpers.ObservationHelper;
import com.appsmith.git.configurations.GitServiceConfig;
import com.fasterxml.jackson.core.PrettyPrinter;
import com.google.gson.GsonBuilder;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
@Import({GitServiceConfig.class})
public class FileOperationsImpl extends FileOperationsCEv2Impl implements FileOperations {
    public FileOperationsImpl(
            GitServiceConfig gitServiceConfig,
            GitExecutor gitExecutor,
            GsonBuilder gsonBuilder,
            PrettyPrinter prettyPrinter,
            ObservationHelper observationHelper) {
        super(gitServiceConfig, gitExecutor, gsonBuilder, prettyPrinter, observationHelper);
    }
}
