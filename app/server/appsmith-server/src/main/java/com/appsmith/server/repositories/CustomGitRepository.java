package com.appsmith.server.repositories;

import com.appsmith.server.domains.GitData;
import reactor.core.publisher.Mono;

public interface CustomGitRepository extends AppsmithRepository<GitData> {
    Mono<GitData> GetUserDetails(String branchName);
}
