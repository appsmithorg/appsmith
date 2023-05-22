package com.appsmith.server.constants.ce;

import com.appsmith.server.constants.FieldName;

public class EmailConstantsCE {

    public static final String WorkspaceEmailSubjectForNewUser = "You’re invited to the workspace %s. \uD83E\uDD73 ";
    public static final String WorkspaceEmailSubjectForExistingUser = "You’re invited to the workspace. \uD83E\uDD73 ";
    public static final String ForgotPasswordEmailSubject = "Reset your Appsmith password";
    public static final String INVITE_EXISTING_USER_TO_WORKSPACE_TEMPLATE_CE = "email/inviteExistingUserToWorkspaceTemplate.html";
    public static final String INVITE_WORKSPACE_TEMPLATE_CE = "email/inviteWorkspaceTemplate.html";
    public static final String INVITE_USER_CLIENT_URL_FORMAT = "%s/user/signup?email=%s";
    public static final String FORGOT_PASSWORD_TEMPLATE_CE = "email/forgotPasswordTemplate.html";
    public static final String EMAIL_ROLE_ADMINISTRATOR_TEXT = "an " + FieldName.ADMINISTRATOR.toLowerCase();
    public static final String EMAIL_ROLE_DEVELOPER_TEXT = "a " + FieldName.DEVELOPER.toLowerCase();
    public static final String EMAIL_ROLE_VIEWER_TEXT = "an " + FieldName.VIEWER.toLowerCase();
    public static final String WORKSPACE_URL = "%s/applications#%s";
}