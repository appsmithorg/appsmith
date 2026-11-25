package com.appsmith.server.dtos;

/**
 * Application counts for support diagnostics. {@code applications}, {@code published}, {@code draft} and
 * {@code gitConnected} count default-branch documents only. {@code gitBranchDocuments} counts every document that
 * names a Git branch.
 */
public record ApplicationDiagnosticsCounts(
        long applications, long published, long draft, long gitConnected, long gitBranchDocuments) {

    public static final ApplicationDiagnosticsCounts EMPTY = new ApplicationDiagnosticsCounts(0, 0, 0, 0, 0);
}
