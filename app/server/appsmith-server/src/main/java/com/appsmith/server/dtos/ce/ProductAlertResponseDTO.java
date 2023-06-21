package com.appsmith.server.dtos.ce;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Immutable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Immutable
public class ProductAlertResponseDTO {
    String messageId;
    String title;
    String learnMoreLink;
    Boolean canDismiss;
    Integer remindLaterDays;
    ProductAlertMessageApplicabilityContext context;
    String applicabilityExpression;
    Integer precedenceIndex;
}
