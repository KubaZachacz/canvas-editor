import type { SVGProps } from "react";
const SvgAlert = (props: SVGProps<SVGSVGElement>) => (
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
      d="M27.617 22.675 18.444 6.442A2.78 2.78 0 0 0 16 5c-1.02 0-1.934.539-2.444 1.442L4.383 22.675c-.51.903-.51 1.98 0 2.883A2.78 2.78 0 0 0 6.827 27h18.346c1.02 0 1.934-.539 2.444-1.442s.51-1.98 0-2.883M26.4 24.84a1.4 1.4 0 0 1-1.227.724H6.827c-.512 0-.97-.27-1.227-.724a1.46 1.46 0 0 1 0-1.447L14.774 7.16A1.4 1.4 0 0 1 16 6.437c.512 0 .97.27 1.226.723L26.4 23.393a1.46 1.46 0 0 1 0 1.447"
    />
    <path
      fill="currentColor"
      d="M16.703 12.17h-1.406v7.182h1.406zM16 20.789a.95.95 0 0 0-.937.957c0 .529.42.958.937.958s.937-.43.937-.958A.95.95 0 0 0 16 20.79"
    />
  </svg>
);
export default SvgAlert;
