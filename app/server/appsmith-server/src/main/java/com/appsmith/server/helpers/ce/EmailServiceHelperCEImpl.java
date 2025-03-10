package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.services.OrganizationService;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.ce.EmailConstantsCE.EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.FORGOT_PASSWORD_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_NAME;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_TO_WORKSPACE_EMAIL_SUBJECT_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.PRIMARY_LINK_TEXT_INVITE_TO_INSTANCE_CE;

@Component
@AllArgsConstructor
public class EmailServiceHelperCEImpl implements EmailServiceHelperCE {

    private final OrganizationService organizationService;

    @Override
    public Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin) {
        return organizationService.getOrganizationConfiguration().map(organization -> {
            final OrganizationConfiguration organizationConfiguration = organization.getOrganizationConfiguration();
            params.put(
                    INSTANCE_NAME, StringUtils.defaultIfEmpty(organizationConfiguration.getInstanceName(), "Appsmith"));
            return params;
        });
    }

    @Override
    public Mono<String> getForgotPasswordTemplate() {
        return Mono.just(FORGOT_PASSWORD_TEMPLATE_CE);
    }

    @Override
    public Mono<String> getWorkspaceInviteTemplate(boolean isNewUser) {
        if (isNewUser) return Mono.just(INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE);

        return Mono.just(INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE);
    }

    @Override
    public Mono<String> getEmailVerificationTemplate() {
        return Mono.just(EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE);
    }

    @Override
    public Mono<String> getAdminInstanceInviteTemplate() {
        return Mono.just(INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE);
    }

    @Override
    public Mono<String> getJoinInstanceCtaPrimaryText() {
        return Mono.just(PRIMARY_LINK_TEXT_INVITE_TO_INSTANCE_CE);
    }

    @Override
    public Mono<String> getSubjectJoinInstanceAsAdmin(String instanceName) {
        return Mono.just(INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT);
    }

    @Override
    public Mono<String> getSubjectJoinWorkspace(String workspaceName) {
        return Mono.just(INVITE_TO_WORKSPACE_EMAIL_SUBJECT_CE);
    }
}
