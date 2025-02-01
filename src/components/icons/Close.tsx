import type { SVGProps } from "react";
const SvgClose = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    fill="none"
    viewBox="0 0 32 32"
    {...props}
  >
    <path
      fill="currentColor"
      d="M5.172 28a1.171 1.171 0 0 1-.829-2L26 4.343a1.172 1.172 0 1 1 1.657 1.658L6 27.657a1.17 1.17 0 0 1-.829.343"
    />
    <path
      fill="currentColor"
      d="M26.828 28a1.17 1.17 0 0 1-.828-.343L4.343 6.001a1.172 1.172 0 0 1 1.658-1.658L27.657 26a1.172 1.172 0 0 1-.829 2"
    />
  </svg>
);
export default SvgClose;
