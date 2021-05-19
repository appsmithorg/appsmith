package com.appsmith.server.helpers;

import com.bazaarvoice.jolt.Shiftr;

public class JoltTransformer {

    /**
     * @param input The object to be transformed
     * @param spec  The specification to be used for transformation
     * @return
     */
    public static Object transform(Object input, Object spec) {
        final Shiftr shiftr = new Shiftr(spec);

        return shiftr.transform(input);
    }

}