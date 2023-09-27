package com.appsmith.server.helpers.ce;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.ce.EmailConstantsCE.EMAIL_VERIFICATION_EMAIL_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.FORGOT_PASSWORD_TEMPLATE_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_ADMIN_INVITE_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_EXISTING_USER_CE;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITE_WORKSPACE_TEMPLATE_NEW_USER_CE;

@Component
public class EmailServiceHelperCEImpl implements EmailServiceHelperCE {
    @Override
    public Mono<Map<String, String>> enrichWithBrandParams(Map<String, String> params, String origin) {
        return Mono.just(params);
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
}
