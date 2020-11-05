package com.appsmith.server.notifications;

import com.appsmith.server.configurations.EmailConfig;
import lombok.extern.slf4j.Slf4j;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.verifyNoInteractions;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
@TestPropertySource(
        properties = {"management.health.mail.enabled=false"})
public class EmailSenderTest {
    @MockBean
    private JavaMailSender javaMailSender;

    @MockBean
    private EmailConfig emailConfig;

    @Autowired
    private EmailSender emailSender;

    @Test
    public void itShouldNotSendMailsWithInvalidAddresses() {
        Mockito.when(emailConfig.isEmailEnabled()).thenReturn(true);

        List<String> invalidAddresses = Arrays.asList(
                "plainaddress",
                "#@%^%#$@#$@#.com",
                "@example.com",
                "Joe Smith <email@example.com>",
                "email.example.com",
                "email@example@example.com",
                ".email@example.com",
                "email.@example.com",
                "email..email@example.com",
                "email@example.com (Joe Smith)",
                "email@-example.com",
                "email@example..com",
                "Abc..123@example.com"
        );

        for (String invalidAddress : invalidAddresses) {
            try {
                emailSender.sendMail(invalidAddress, "test-subject", "email/welcomeUserTemplate.html", Collections.emptyMap()).block();

                verifyNoInteractions(javaMailSender);
            } catch (Throwable exc) {
                System.out.println("******************************");
                System.out.println(String.format("Failed for >>> %s", invalidAddress));
                System.out.println("******************************");
                throw exc;
            }
        }
    }
}
