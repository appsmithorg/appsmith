import { unmountComponentAtNode } from "react-dom";
import { render } from "test/testUtils";
import GetAppViewerHeaderCTA from "./GetAppViewerHeaderCTA";
import { waitFor } from "@testing-library/dom";
import { ANONYMOUS_USERNAME } from "constants/userConstants";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => jest.fn(),
}));

const sampleProps = {
  url:
    "/applications/606ad816c7a35467ac887f87/pages/606ad816c7a35467ac887f89/edit",
  canEdit: true,
  currentApplicationDetails: {
    id: "606ad816c7a35467ac887f87",
    userPermissions: [
      "manage:applications",
      "canComment:applications",
      "read:applications",
      "publish:applications",
      "makePublic:applications",
    ],
    name: "Untitled application 1",
    organizationId: "606ad7eec7a35467ac887f84",
    isPublic: false,
    pages: [
      {
        id: "606ad816c7a35467ac887f89",
        isDefault: true,
        default: true,
      },
    ],
    appIsExample: false,
    color: "#C03C3C",
    icon: "flag",
    new: false,
  },
  currentUser: {
    userPermissions: [],
    email: "b1@appsmith.com",
    source: "FORM",
    isEnabled: true,
    currentOrganizationId: "606ad7eec7a35467ac887f84",
    organizationIds: ["606ad7eec7a35467ac887f84"],
    groupIds: [],
    permissions: [],
    isAnonymous: false,
    username: "b1@appsmith.com",
    accountNonExpired: true,
    accountNonLocked: true,
    credentialsNonExpired: true,
    claims: {},
    enabled: true,
    address: {},
    new: true,
  },
  forkUrl:
    "/user/login?redirectUrl=https://dev.appsmith.com/applications/606ad816c7a35467ac887f87/pages/606ad816c7a35467ac887f89/fork",
  loginUrl:
    "/user/login?redirectUrl=https://dev.appsmith.com/applications/606ad816c7a35467ac887f87/pages/606ad816c7a35467ac887f89",
};

let container: any = null;
describe("get app viewer header CTA", () => {
  beforeEach(async () => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  it("renders the edit app button and does not render the fork app button", async () => {
    const CTA = GetAppViewerHeaderCTA(sampleProps);
    if (CTA) {
      render(CTA);
      const result = await waitFor(() =>
        document.querySelector(".t--back-to-editor"),
      );
      expect(!!result).toBeTruthy();

      const forkButton = await waitFor(() =>
        document.querySelector(".t--fork-app"),
      );
      expect(!!forkButton).toBeFalsy();
    }
  });
  it("renders the fork app button", async () => {
    const CTA = GetAppViewerHeaderCTA({
      ...sampleProps,
      canEdit: false,
      currentApplicationDetails: {
        ...sampleProps.currentApplicationDetails,
        forkingEnabled: true,
        isPublic: true,
      },
      currentUser: {
        ...sampleProps.currentUser,
        username: ANONYMOUS_USERNAME,
      },
    });
    if (CTA) {
      render(CTA);
      const result = await waitFor(() =>
        document.querySelector(".t--fork-app"),
      );
      expect(!!result).toBeTruthy();
    }
  });
  it("renders the fork app link", async () => {
    const CTA = GetAppViewerHeaderCTA({
      ...sampleProps,
      canEdit: false,
      currentApplicationDetails: {
        ...sampleProps.currentApplicationDetails,
        forkingEnabled: true,
        isPublic: true,
      },
    });
    if (CTA) {
      render(CTA);
      const result = await waitFor(() =>
        document.querySelector(".t--fork-btn-wrapper"),
      );
      expect(!!result).toBeTruthy();
    }
  });
  it("renders the sign in link", async () => {
    const CTA = GetAppViewerHeaderCTA({
      ...sampleProps,
      canEdit: false,
      currentApplicationDetails: {
        ...sampleProps.currentApplicationDetails,
        isPublic: true,
      },
    });
    if (CTA) {
      render(CTA);
      const result = await waitFor(() => document.querySelector(".t--sign-in"));
      expect(!!result).toBeTruthy();
    }
  });
  afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });
});
