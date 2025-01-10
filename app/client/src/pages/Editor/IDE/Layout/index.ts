// Re-export types only to prevent circular dependencies
export type { BaseLayoutProps, LayoutProps, Area } from "./Layout.types";

// Export layout components through dynamic imports
export const AnimatedLayout = () => import("./AnimatedLayout").then(m => m.AnimatedLayout);
export const StaticLayout = () => import("./StaticLayout").then(m => m.StaticLayout);
