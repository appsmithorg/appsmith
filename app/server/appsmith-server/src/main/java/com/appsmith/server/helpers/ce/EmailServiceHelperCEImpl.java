package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.TenantService;
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

    private final TenantService tenantService;

    @Override
    public Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin) {
        return tenantService.getTenantConfiguration().map(tenant -> {
            final TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
            params.put(INSTANCE_NAME, StringUtils.defaultIfEmpty(tenantConfiguration.getInstanceName(), "Appsmith"));
            return params;
        });
    }

    @Override
    public String getForgotPasswordTemplate() {
        return FORGOT_PASSWORD_TEMPLATE_CE;
    }

    @Override
    public String getWorkspaceInviteTemplate(boolean isNewUser) {
        if (isNewUser) return INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE;

        return INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE;
    }

    @Override
    public String getEmailVerificationTemplate() {
        return EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE;
    }

    @Override
    public String getAdminInstanceInviteTemplate() {
        return INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE;
    }

    @Override
    public String getJoinInstanceCtaPrimaryText() {
        return PRIMARY_LINK_TEXT_INVITE_TO_INSTANCE_CE;
    }

    @Override
    public String getSubjectJoinInstanceAsAdmin(String instanceName) {
        return INSTANCE_ADMIN_INVITE_EMAIL_SUBJECT;
    }

    @Override
    public String getSubjectJoinWorkspace(String workspaceName) {
        return INVITE_TO_WORKSPACE_EMAIL_SUBJECT_CE;
    }
}
