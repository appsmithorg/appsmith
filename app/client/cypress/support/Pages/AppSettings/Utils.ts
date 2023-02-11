export const checkUrl = (
  appName: string,
  pageName: string,
  customSlug?: string,
  editMode = true,
) => {
  cy.location("pathname").then((pathname) => {
    if (customSlug && customSlug.length > 0) {
      const pageId = pathname
        .split("/")[2]
        ?.split("-")
        .pop();
      expect(pathname).to.be.equal(
        `/app/${customSlug}-${pageId}${editMode ? "/edit" : ""}`.toLowerCase(),
      );
    } else {
      const pageId = pathname
        .split("/")[3]
        ?.split("-")
        .pop();
      expect(pathname).to.be.equal(
        `/app/${appName}/${pageName}-${pageId}${
          editMode ? "/edit" : ""
        }`.toLowerCase(),
      );
    }
  });
};
