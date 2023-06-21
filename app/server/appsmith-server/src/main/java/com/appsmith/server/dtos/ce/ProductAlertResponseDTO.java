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
    String messageid;
    String title;
    String learnmorelink;
    Boolean candismiss;
    Integer remindlaterdays;
    List<String> featureFlagEnumList;
}
