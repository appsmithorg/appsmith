package com.appsmith.server.dtos;

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
public class ProductAlertResponseDTO implements Comparable<ProductAlertResponseDTO> {
    String messageId;
    String title;
    String message;
    String learnMoreLink;
    Boolean canDismiss;
    Integer remindLaterDays;
    ProductAlertMessageApplicabilityContext context;
    String applicabilityExpression;
    Integer precedenceIndex;

    @Override
    public int compareTo(ProductAlertResponseDTO productAlertResponseDTO) {
        if (this.precedenceIndex < productAlertResponseDTO.getPrecedenceIndex()) {
            return -1;
        } else if (this.precedenceIndex > productAlertResponseDTO.getPrecedenceIndex()) {
            return 1;
        } else {
            return 0;
        }
    }
}
