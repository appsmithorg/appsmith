import * as React from "react";
import type { SVGProps } from "react";
const ButtonThumbnail = (props: SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" width={72} height={76} fill="none" {...props}><rect width={55} height={23} x={8.5} y={26.5} fill="#FFEEE5" stroke="#CC3D00" rx={5.5} /><path stroke="#CC3D00" strokeLinecap="round" strokeLinejoin="round" d="M37.5 33.5v4m0 4v-4m6-4-3.414 3.414a2 2 0 0 1-1.414.586H37.5M37.5 41.5v-8m6 8-4-4M28.5 38.5v-2a3 3 0 1 1 6 0v2a3 3 0 1 1-6 0" /></svg>;
export { ButtonThumbnail };