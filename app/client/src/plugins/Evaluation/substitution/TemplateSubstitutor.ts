import { Substitutor } from ".";


export class TemplateSubstitutor extends Substitutor {
    private static _instance: TemplateSubstitutor;
    constructor() {
        if (TemplateSubstitutor._instance) {
            return TemplateSubstitutor._instance;
        }
        super();
        TemplateSubstitutor._instance = this;
    }
    substitute(binding: string, subBindings: string[], subValues: unknown[]) {
        // Replace the string with the data tree values
        let finalValue = binding;
        subBindings.forEach((b, i) => {
            let value = subValues[i];
            if (Array.isArray(value) || _.isObject(value)) {
                value = JSON.stringify(value);
            }
            try {
                if (typeof value === "string" && JSON.parse(value)) {
                    value = value.replace(/\\([\s\S])|(")/g, "\\$1$2");
                }
            } catch (e) {
                // do nothing
            }
            finalValue = finalValue.replace(b, `${value}`);
        });
        return finalValue;
    }
}
