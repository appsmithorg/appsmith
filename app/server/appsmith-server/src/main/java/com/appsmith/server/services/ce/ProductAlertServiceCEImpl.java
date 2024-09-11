package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ProductAlertResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.LoadShifter;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.EvaluationException;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class ProductAlertServiceCEImpl implements ProductAlertServiceCE {

    private final CommonConfig commonConfig;

    private final ObjectMapper mapper;

    private final ProductAlertResponseDTO[] messages;

    public ProductAlertServiceCEImpl(ObjectMapper objectMapper, CommonConfig commonConfig) {
        this.commonConfig = commonConfig;
        this.mapper = objectMapper;
        ClassLoader classLoader = getClass().getClassLoader();
        try {
            this.messages = mapper.readValue(
                    new String(
                            classLoader
                                    .getResource("productAlerts/productAlertMessages.json")
                                    .openStream()
                                    .readAllBytes(),
                            StandardCharsets.UTF_8),
                    ProductAlertResponseDTO[].class);
        } catch (Exception e) {
            log.error("failed to read product alert properties correctly.", e);
            throw new AppsmithException(AppsmithError.INVALID_PROPERTIES_CONFIGURATION, "productalertmessages");
        }
    }

    public Mono<List<ProductAlertResponseDTO>> getSingleApplicableMessage() {
        return Mono.fromCallable(() -> {
                    List<ProductAlertResponseDTO> applicableMessages = Arrays.stream(messages)
                            .sorted()
                            .filter(this::evaluateAlertApplicability)
                            .toList();
                    return applicableMessages;
                })
                .onErrorResume(error -> {
                    log.error("exception while getting and filtering product alert messages", error);
                    throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR, error.getMessage());
                })
                .subscribeOn(LoadShifter.elasticScheduler);
    }

    public Boolean evaluateAlertApplicability(ProductAlertResponseDTO productAlertResponseDTO) {
        ExpressionParser expressionParser = new SpelExpressionParser();
        Expression expression = expressionParser.parseExpression(productAlertResponseDTO.getApplicabilityExpression());
        switch (productAlertResponseDTO.getContext()) {
            case COMMON_CONFIG:
                EvaluationContext context = new StandardEvaluationContext(commonConfig);
                try {
                    return (Boolean) expression.getValue(context);
                } catch (EvaluationException ee) {
                    log.error(
                            "error while evaluating applicability expression. message not added applicable messages.",
                            ee);
                    return false;
                }
            case STATIC:
                return (Boolean) expression.getValue();
            default:
                return true;
        }
    }
}
