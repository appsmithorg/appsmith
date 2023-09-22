package com.appsmith.server.services;

import com.appsmith.server.enums.ChatGenerationType;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@SpringBootTest
class ChatServiceFactoryTest {
    @Autowired
    ChatServiceFactory chatServiceFactory;

    @Test
    public void testChatServiceFactory_getCodeGenerationServices() {
        CodeGeneratorService codeGeneratorService = chatServiceFactory.codeGeneratorService(ChatGenerationType.SQL);
        Assertions.assertTrue(codeGeneratorService instanceof SqlGeneratorService);
        codeGeneratorService = chatServiceFactory.codeGeneratorService(ChatGenerationType.JS_EXPR);
        Assertions.assertTrue(codeGeneratorService instanceof JsCodeGeneratorService);
    }
}
