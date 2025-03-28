import React from "react";
import type { Page } from "entities/Page";
import { PageEntity } from "./PageEntity";

interface PageListProps {
  pages: Page[];
  onItemSelected: () => void;
}

export const PageList = ({ onItemSelected, pages }: PageListProps) => {
  return (
    <>
      {pages.map((page) => (
        <PageEntity key={page.pageId} onClick={onItemSelected} page={page} />
      ))}
    </>
  );
};
