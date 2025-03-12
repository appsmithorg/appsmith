package com.appsmith.server.helpers.ce;

import reactor.core.publisher.Mono;

import java.util.Map;

public interface EmailServiceHelperCE {
    Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin);

    Mono<String> getForgotPasswordTemplate();

    Mono<String> getWorkspaceInviteTemplate(boolean isNewUser);

    Mono<String> getEmailVerificationTemplate();

    Mono<String> getAdminInstanceInviteTemplate();

    Mono<String> getJoinInstanceCtaPrimaryText();

    Mono<String> getSubjectJoinInstanceAsAdmin(String instanceName);

    Mono<String> getSubjectJoinWorkspace(String workspaceName);
}
