package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EntityDependencyNode {
    @JsonView(Views.Api.class)
    EntityReferenceType entityReferenceType;

    @JsonView(Views.Api.class)
    String validEntityName;

    @JsonView(Views.Api.class)
    String referenceString;

    @JsonView(Views.Api.class)
    Boolean isAsync;

    @JsonView(Views.Api.class)
    Boolean isFunctionCall;

    @JsonView(Views.Api.class)
    ActionDTO actionDTO;

    @JsonView(Views.Api.class)
    public boolean isValidDynamicBinding() {
        boolean result = true;

        if (this.referenceString == null) {
            // This node represents an entity that has been explicitly marked to run on page load
            return true;
        }

        if (EntityReferenceType.ACTION.equals(this.entityReferenceType)) {
            if (!this.referenceString.startsWith(this.validEntityName + ".data")) {
                result = false;
            }
        } else if (EntityReferenceType.JSACTION.equals(this.entityReferenceType)) {
            if (Boolean.TRUE.equals(this.isAsync) && (Boolean.TRUE.equals(this.isFunctionCall) || !this.referenceString.startsWith(this.validEntityName + ".data"))) {
                result = false;
            }

            if (Boolean.FALSE.equals(this.isAsync)) {
                if (Boolean.TRUE.equals(this.isFunctionCall) && !this.validEntityName.equals(this.referenceString)) {
                    result = false;
                }
                if (Boolean.FALSE.equals(this.isFunctionCall) && !this.referenceString.startsWith(this.validEntityName + ".data")) {
                    result = false;
                }
            }

            // TODO: This one feels a little hacky. Should we introduce another property that handles whether the node is coming from a binding or i
            if (this.isAsync == null && !this.referenceString.startsWith(this.validEntityName + ".data")) {
                result = false;
            }
        }
        return result;
    }
}
