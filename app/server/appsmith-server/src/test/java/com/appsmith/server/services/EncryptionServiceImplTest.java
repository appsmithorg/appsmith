package com.appsmith.server.services;

import com.appsmith.external.services.EncryptionService;
import org.junit.Assert;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RunWith(SpringRunner.class)
@SpringBootTest
class EncryptionServiceImplTest {

    @Autowired
    EncryptionService encryptionService;

    @Test
    void testPattern() {
        final Pattern pattern = Pattern.compile("([a-zA-Z_][a-zA-Z0-9_]*)[.]data([.]([a-zA-Z0-9._]+))?($|[^a-zA-Z0-9_.])");

        final Matcher matcher = pattern.matcher("testCollection.data.testAction");
        while (matcher.find()) {
            // Assertions.assertEquals(3, matcher.groupCount());
            System.out.println(matcher.group());
        }
    }

    @Test
    void decryptString() {
        final String decrypted = encryptionService.decryptString("c2e41857714558b1488c1c8a63661f9962bb4d2ceeca5633900fbc9c5b75edb8");
        final String encrypted = encryptionService.encryptString("");
        System.out.println(decrypted);

    }
}