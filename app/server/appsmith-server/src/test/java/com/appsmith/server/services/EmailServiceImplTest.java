package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.notifications.EmailSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.EmailConstants.APPLICATION_EMAIL_SUBJECT_FOR_NEW_USER;
import static com.appsmith.server.constants.EmailConstants.BRAND_BACKGROUND_COLOR;
import static com.appsmith.server.constants.EmailConstants.BRAND_FONT_COLOR;
import static com.appsmith.server.constants.EmailConstants.BRAND_PRIMARY_COLOR;
import static com.appsmith.server.constants.EmailConstants.INVITER_APPLICATION_NAME;
import static com.appsmith.server.constants.EmailConstants.INVITE_APP_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_EMAIL_SUBJECT;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_EMAIL_SUBJECT_VIA_GROUP;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_EMAIL_TEMPLATE_VIA_GROUPS;
import static com.appsmith.server.constants.EmailConstants.LOGO_URL;
import static com.appsmith.server.constants.FieldName.INSTANCE_ID;
import static com.appsmith.server.constants.ce.EmailConstantsCE.EMAIL_ROLE_DEVELOPER_TEXT;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_NAME;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INVITER_FIRST_NAME;
import static com.appsmith.server.constants.ce.EmailConstantsCE.PRIMARY_LINK_TEXT;
import static com.appsmith.server.constants.ce.EmailConstantsCE.PRIMARY_LINK_URL;
import static graphql.Assert.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class EmailServiceImplTest {

    @Autowired
    TenantService tenantService;

    @Mock
    EmailSender mockEmailSender;

    private EmailService emailService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        TenantConfiguration tenantConfiguration = new TenantConfiguration();

        Tenant tenant = tenantService.getDefaultTenant().block();
        assert tenant != null;
        tenant.setTenantConfiguration(tenantConfiguration);

        this.emailService = new EmailServiceImpl(mockEmailSender, tenantService);
    }

    @Test
    public void testSendInviteUserToApplicationEmail() {
        // Create test data
        User invitingUser = new User();
        String invitingUserMail = "a@abc.com";
        invitingUser.setEmail(invitingUserMail);

        User invitedUser = new User();
        String invitedUserMail = "b@abc.com";
        invitedUser.setEmail(invitedUserMail);

        Application applicationInvitedTo = new Application();
        applicationInvitedTo.setName("TestApplication");

        String addedRole = "Developer" + "role";
        String instanceId = "TestInstanceId";
        String originHeader = "TestOriginHeader";
        boolean isNewUser = true;

        Map<String, String> expectedParams = new HashMap<>();
        expectedParams.put(INSTANCE_ID, instanceId);
        expectedParams.put(INVITER_FIRST_NAME, invitingUser.getEmail());

        doAnswer(invocation -> {
                    String to = invocation.getArgument(0);
                    String subject = invocation.getArgument(1);
                    String text = invocation.getArgument(2);
                    Map<String, String> params = invocation.getArgument(3);

                    assertEquals(invitedUser.getEmail(), to);
                    assertEquals(
                            String.format(APPLICATION_EMAIL_SUBJECT_FOR_NEW_USER, applicationInvitedTo.getName()),
                            subject);
                    assertEquals(INVITE_APP_TEMPLATE, text);
                    assertTrue(params.containsKey(INVITER_APPLICATION_NAME));
                    assertEquals(expectedParams.get(INVITER_FIRST_NAME), params.get(INVITER_FIRST_NAME));
                    assertEquals(expectedParams.get(INSTANCE_ID), params.get(INSTANCE_ID));
                    assertEquals(EMAIL_ROLE_DEVELOPER_TEXT, params.get(FieldName.ROLE));
                    assertTrue(params.containsKey(PRIMARY_LINK_URL));
                    assertTrue(params.containsKey(PRIMARY_LINK_TEXT));
                    assertTrue(params.containsKey(INSTANCE_NAME));
                    assertTrue(params.containsKey(LOGO_URL));
                    assertTrue(params.containsKey(BRAND_PRIMARY_COLOR));
                    assertTrue(params.containsKey(BRAND_FONT_COLOR));
                    assertTrue(params.containsKey(BRAND_BACKGROUND_COLOR));

                    return Mono.just(true);
                })
                .when(mockEmailSender)
                .sendMail(anyString(), anyString(), anyString(), anyMap());

        emailService
                .sendInviteUserToApplicationEmail(
                        invitingUser, invitedUser, applicationInvitedTo, addedRole, instanceId, originHeader, isNewUser)
                .block();
    }

    @Test
    public void testSendInviteUserToInstanceEmail() {
        // Create test data
        User invitingUser = new User();
        String invitingUserMail = "a@abc.com";
        invitingUser.setEmail(invitingUserMail);

        User invitedUser = new User();
        String invitedUserMail = "b@abc.com";
        invitedUser.setEmail(invitedUserMail);

        String addedRole = "TestRole";
        String instanceName = "TestInstance";
        String originHeader = "TestOriginHeader";

        Map<String, String> expectedParams = new HashMap<>();
        expectedParams.put(INSTANCE_NAME, instanceName);
        expectedParams.put(INVITER_FIRST_NAME, invitingUser.getEmail());

        doAnswer(invocation -> {
                    String to = invocation.getArgument(0);
                    String subject = invocation.getArgument(1);
                    String text = invocation.getArgument(2);
                    Map<String, String> params = invocation.getArgument(3);

                    assertEquals(invitedUser.getEmail(), to);
                    assertEquals(String.format(INVITE_TO_INSTANCE_EMAIL_SUBJECT, instanceName), subject);
                    assertEquals(INVITE_TO_INSTANCE_EMAIL_TEMPLATE, text);
                    assertTrue(params.containsKey(PRIMARY_LINK_URL));
                    assertTrue(params.containsKey(PRIMARY_LINK_TEXT));
                    assertTrue(params.containsKey(INSTANCE_NAME));
                    assertTrue(params.containsKey(LOGO_URL));
                    assertTrue(params.containsKey(BRAND_PRIMARY_COLOR));
                    assertTrue(params.containsKey(BRAND_FONT_COLOR));
                    assertTrue(params.containsKey(BRAND_BACKGROUND_COLOR));
                    assertEquals(expectedParams.get(INVITER_FIRST_NAME), params.get(INVITER_FIRST_NAME));

                    return Mono.just(true);
                })
                .when(mockEmailSender)
                .sendMail(anyString(), anyString(), anyString(), anyMap());

        emailService
                .sendInviteUserToInstanceEmail(invitingUser, invitedUser, addedRole, instanceName, originHeader)
                .block();
    }

    @Test
    public void testSendInviteUserToInstanceEmailViaGroupInvite() {
        // Create test data
        User invitingUser = new User();
        String invitingUserMail = "a@abc.com";
        invitingUser.setEmail(invitingUserMail);

        User invitedUser = new User();
        String invitedUserMail = "b@abc.com";
        invitedUser.setEmail(invitedUserMail);

        String addedGroup = "TestGroup";
        String instanceName = "TestInstance";
        String originHeader = "TestOriginHeader";

        Map<String, String> expectedParams = new HashMap<>();
        expectedParams.put(INSTANCE_NAME, instanceName);
        expectedParams.put(INVITER_FIRST_NAME, invitingUser.getEmail());

        doAnswer(invocation -> {
                    String to = invocation.getArgument(0);
                    String subject = invocation.getArgument(1);
                    String text = invocation.getArgument(2);
                    Map<String, String> params = invocation.getArgument(3);

                    assertEquals(invitedUser.getEmail(), to);
                    assertEquals(String.format(INVITE_TO_INSTANCE_EMAIL_SUBJECT_VIA_GROUP, addedGroup), subject);
                    assertEquals(INVITE_TO_INSTANCE_EMAIL_TEMPLATE_VIA_GROUPS, text);
                    assertTrue(params.containsKey(PRIMARY_LINK_URL));
                    assertTrue(params.containsKey(PRIMARY_LINK_TEXT));
                    assertTrue(params.containsKey(INSTANCE_NAME));
                    assertTrue(params.containsKey(LOGO_URL));
                    assertTrue(params.containsKey(BRAND_PRIMARY_COLOR));
                    assertTrue(params.containsKey(BRAND_FONT_COLOR));
                    assertTrue(params.containsKey(BRAND_BACKGROUND_COLOR));
                    assertEquals(expectedParams.get(INVITER_FIRST_NAME), params.get(INVITER_FIRST_NAME));

                    return Mono.just(true);
                })
                .when(mockEmailSender)
                .sendMail(anyString(), anyString(), anyString(), anyMap());

        emailService
                .sendInviteUserToInstanceEmailViaGroupInvite(
                        invitingUser, invitedUser, addedGroup, instanceName, originHeader)
                .block();
    }
}
