package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ce.ProductAlertResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
@PropertySource("classpath:/productAlerts/productAlertMessages.yml")
public class ProductAlertServiceImpl implements ProductAlertService {
    String messageListJSONString;

    ProductAlertResponseDTO[] messages;

    public ProductAlertServiceImpl(@Value("${productalertmessages}") String messageListJSONString) {
        this.messageListJSONString = messageListJSONString;
        ObjectMapper mapper = new ObjectMapper();
        try {
            this.messages = mapper.readValue(messageListJSONString, ProductAlertResponseDTO[].class);
        } catch (Exception e) {
            log.error("failed to read product alert properties correctly.", e);
            throw new RuntimeException(e);
        }
    }

    public Mono<ProductAlertResponseDTO> getSingleApplicableMessage() {
        return Mono.just(messages[0]);
    }
}
