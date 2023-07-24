package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ce.ProductAlertResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@TestPropertySource("classpath:/productAlerts/productAlertMessages.yml")
@Slf4j
@ExtendWith(SpringExtension.class)
public class ProductAlertServiceCEImplTest {

    @Value("${productalertmessages}")
    String messageListJSONString;

    ObjectMapper mapper;

    @MockBean
    CommonConfig commonConfig;

    ProductAlertResponseDTO[] messages = null;

    @BeforeEach
    public void setup() {
        try {
            this.mapper = new ObjectMapper();
            this.messages = mapper.readValue(messageListJSONString, ProductAlertResponseDTO[].class);
        } catch (Exception e) {
            log.error("failed to read product alert properties correctly.", e);
            throw new AppsmithException(AppsmithError.INVALID_PROPERTIES_CONFIGURATION, "productalertmessages");
        }
    }

    @Test
    public void getSingleApplicableMessage_selfHostedInstance_success() {
        ProductAlertServiceCE productAlertServiceCE =
                new ProductAlertServiceCEImpl(messageListJSONString, mapper, commonConfig);
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(false);
        Mono<java.util.List<ProductAlertResponseDTO>> productAlertResponseDTOMono =
                productAlertServiceCE.getSingleApplicableMessage();
        StepVerifier.create(productAlertResponseDTOMono)
                .assertNext(productAlertResponseDTOs -> {
                    assertThat(productAlertResponseDTOs.get(0).getMessageId()).isEqualTo(messages[0].getMessageId());
                })
                .verifyComplete();
    }

    @Test
    public void getSingleApplicableMessage_cloudInstance_success() {
        ProductAlertServiceCE productAlertServiceCE =
                new ProductAlertServiceCEImpl(messageListJSONString, mapper, commonConfig);
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(true);
        Mono<List<ProductAlertResponseDTO>> productAlertResponseDTOMono =
                productAlertServiceCE.getSingleApplicableMessage();
        StepVerifier.create(productAlertResponseDTOMono)
                .assertNext(productAlertResponseDTOs -> {
                    assertThat(productAlertResponseDTOs.get(0).getMessageId()).isEqualTo(messages[1].getMessageId());
                })
                .verifyComplete();
    }

    @Test
    public void getSingleApplicableMessage_malformedExpression() throws NoSuchFieldException, IllegalAccessException {
        ProductAlertServiceCE productAlertServiceCE =
                new ProductAlertServiceCEImpl(messageListJSONString, mapper, commonConfig);
        Field messageField = productAlertServiceCE.getClass().getDeclaredField("messages");
        messageField.setAccessible(true);
        messages[0].setApplicabilityExpression("invalidExpression");
        messageField.set(productAlertServiceCE, messages);
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(true);
        Mono<List<ProductAlertResponseDTO>> productAlertResponseDTOMono =
                productAlertServiceCE.getSingleApplicableMessage();
        StepVerifier.create(productAlertResponseDTOMono).expectError(AppsmithException.class);
    }
}
