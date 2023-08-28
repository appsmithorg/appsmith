import { Types, getType } from "utils/TypeHelpers";
import { Substitutor } from ".";


export class SmartSubstitutor extends Substitutor {
    private static _instance: SmartSubstitutor;
    constructor() {
        if (SmartSubstitutor._instance) {
            return SmartSubstitutor._instance;
        }
        super();
        SmartSubstitutor._instance = this;
    }
    substitute(
        originalBinding: string,
        subSegments: string[],
        subSegmentValues: unknown[]
    ) {
        const { binding, subBindings, subValues } = this.filterBindingSegmentsAndRemoveQuotes(
            originalBinding,
            subSegments,
            subSegmentValues
        );
        let finalBinding = binding;
        subBindings.forEach((b, i) => {
            const value = subValues[i];
            switch (getType(value)) {
                case Types.NUMBER:
                case Types.BOOLEAN:
                case Types.NULL:
                case Types.UNDEFINED:
                    // Direct substitution
                    finalBinding = finalBinding.replace(b, `${value}`);
                    break;
                case Types.STRING:
                    // Add quotes to a string
                    // JSON.stringify string to escape any unsupported characters
                    finalBinding = finalBinding.replace(b, `${JSON.stringify(value)}`);
                    break;
                case Types.ARRAY:
                case Types.OBJECT:
                    // Stringify and substitute
                    finalBinding = finalBinding.replace(
                        b,
                        JSON.stringify(value, null, 2)
                    );
                    break;
            }
        });
        return finalBinding;
    }
}
