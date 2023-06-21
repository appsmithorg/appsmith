package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ce.ProductAlertResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Service
@Slf4j
@PropertySource("classpath:/productAlerts/productAlertMessages.yml")
public class ProductAlertServiceCEImpl implements ProductAlertServiceCE {
    String messageListJSONString;

    CommonConfig commonConfig;

    ObjectMapper mapper;

    ProductAlertResponseDTO[] messages;

    private final Scheduler scheduler = Schedulers.boundedElastic();

    public ProductAlertServiceCEImpl(@Value("${productalertmessages}") String messageListJSONString, ObjectMapper objectMapper, CommonConfig commonConfig) {
        this.messageListJSONString = messageListJSONString;
        this.commonConfig = commonConfig;
        this.mapper = objectMapper;
        try {
            this.messages = mapper.readValue(messageListJSONString, ProductAlertResponseDTO[].class);
        } catch (Exception e) {
            log.error("failed to read product alert properties correctly.", e);
            throw new AppsmithException(AppsmithError.INVALID_PROPERTIES_CONFIGURATION, "productalertmessages");
        }
    }

    public Mono<ProductAlertResponseDTO> getSingleApplicableMessage() {
        return Mono.fromCallable(() -> {
            List<ProductAlertResponseDTO> applicableMessages =
                    Arrays.stream(messages).filter(this::evaluateAlertApplicability).toList();
            return applicableMessages.get(0);
        }).onErrorResume(error -> {
            log.error("exception while getting and filtering product alert messages", error);
            throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR, error.getMessage());
        })
        .subscribeOn(scheduler);
    }

    public Boolean evaluateAlertApplicability(ProductAlertResponseDTO productAlertResponseDTO) {
        ExpressionParser expressionParser = new SpelExpressionParser();
        Expression expression = expressionParser.parseExpression(productAlertResponseDTO.getApplicabilityExpression());
        switch (productAlertResponseDTO.getContext()) {
            case COMMON_CONFIG:
                EvaluationContext context = new StandardEvaluationContext(commonConfig);
                return (Boolean) expression.getValue(context);
            case STATIC:
                return (Boolean) expression.getValue();
            default:
                return true;
        }
    }
}
