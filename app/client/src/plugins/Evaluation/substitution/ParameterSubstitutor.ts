import { Substitutor } from ".";


export class ParameterSubstitutor extends Substitutor {
    private static _instance: ParameterSubstitutor;
    constructor() {
        if (ParameterSubstitutor._instance) {
            return ParameterSubstitutor._instance;
        }
        super();
        ParameterSubstitutor._instance = this;
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
        // if only one binding is provided in the whole string, we need to throw an error
        if (subSegments.length === 1 && subBindings.length === 1) {
            throw Error(
                "Dynamic bindings in prepared statements are only used to provide parameters inside SQL query. No SQL query found."
            );
        }

        let finalBinding = binding;
        const parameters: Record<string, unknown> = {};
        subBindings.forEach((b, i) => {
            // Replace binding with $1, $2;
            const key = `$${i + 1}`;
            finalBinding = finalBinding.replace(b, key);
            parameters[key] =
                typeof subValues[i] === "object"
                    ? JSON.stringify(subValues[i], null, 2)
                    : subValues[i];
        });
        return { value: finalBinding, parameters };
    }
}
