import { render } from "test/testUtils";
import React from "react";
import Radio from "pages/AdminSettings/FormGroup/Radio";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { reduxForm } from "redux-form";
import { AppsmithFrameAncestorsSetting } from "pages/Applications/EmbedSnippet/Constants/constants";
import { APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING } from "./configuration";

// Render the real frame-ancestors radio setting with the given form value.
// Passing `undefined` simulates a cold bootstrap of /settings/configuration,
// where the admin-settings store is not yet hydrated and redux-form calls the
// field's format() with undefined.
function renderFrameAncestorsRadio(value: string | undefined) {
  function FrameAncestorsRadio() {
    return <Radio setting={APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING} />;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Parent = reduxForm<any, any>({
    validate: () => ({}),
    form: SETTINGS_FORM_NAME,
    touchOnBlur: true,
  })(FrameAncestorsRadio);

  return render(<Parent />, {
    initialState: {
      form: {
        [SETTINGS_FORM_NAME]: {
          values:
            value === undefined
              ? {}
              : { [APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING.id]: value },
        },
      },
    },
  });
}

describe("APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING radio", () => {
  it("renders without crashing when the setting is not yet hydrated (cold bootstrap)", () => {
    // Regression: on a hard refresh of /settings/configuration the value is
    // undefined, so format() must tolerate it instead of throwing and taking the
    // whole settings page to the error boundary.
    expect(() => renderFrameAncestorsRadio(undefined)).not.toThrow();
    expect(document.querySelectorAll("input[type=radio]").length).toBe(3);
  });

  it("selects Allow embedding everywhere for a value containing a bare *", () => {
    renderFrameAncestorsRadio("'self' *");

    const radios =
      document.querySelectorAll<HTMLInputElement>("input[type=radio]");

    // Options render in config order: allow / limit / disable.
    expect(radios[0].value).toBe(
      AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE,
    );
    expect(radios[0].checked).toBe(true);
  });
});

describe("APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING parse (stored value)", () => {
  // The parse step is what actually writes the env value on save.
  const parse = APPSMITH_ALLOWED_FRAME_ANCESTORS_SETTING.parse as (v: {
    value: string;
    additionalData?: string;
  }) => string;

  it("quotes a bare self typed in the limit list so it is never persisted raw", () => {
    expect(
      parse({
        value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
        additionalData: "self,https://a.com",
      }),
    ).toBe("'self' https://a.com");
  });

  it("stores the quoted keywords for the allow/disable options", () => {
    expect(
      parse({
        value: AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE,
      }),
    ).toBe("*");
    expect(
      parse({
        value: AppsmithFrameAncestorsSetting.DISABLE_EMBEDDING_EVERYWHERE,
      }),
    ).toBe("'none'");
  });
});
