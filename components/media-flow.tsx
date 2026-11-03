export function MediaFlow() {
  return (
    <svg
      viewBox="0 0 480 380"
      role="img"
      aria-label="An image is uploaded, scheduled as a Buffer post, then deleted after publishing"
      className="mx-auto block w-full max-w-[520px] lg:ml-auto lg:mr-0"
    >
      <g className="ms-lift">
        <rect x="24" y="128" width="132" height="104" fill="none" className="stroke-paper" strokeWidth="1.2" />
        <path d="M40 214l30-36 22 25 16-18 32 29" fill="none" className="stroke-paper" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="122" cy="152" r="8" fill="none" className="stroke-terracotta" strokeWidth="1.2" />
      </g>
      <text x="24" y="262" className="fill-muted font-sans" fontSize="12">
        Your file
      </text>

      <path className="ms-flow stroke-terracotta" d="M168 180 H262" strokeWidth="1.4" fill="none" />
      <path d="M256 174l8 6-8 6" fill="none" className="stroke-terracotta" strokeWidth="1.4" />

      <rect x="276" y="64" width="184" height="236" className="fill-surface stroke-line-strong" strokeWidth="1" />
      <circle cx="298" cy="88" r="9" fill="none" className="stroke-muted" strokeWidth="1" />
      <rect x="314" y="82" width="70" height="5" className="fill-line-strong" />
      <rect x="314" y="92" width="44" height="4" className="fill-line" />
      <g className="ms-file">
        <rect x="290" y="112" width="156" height="104" fill="none" className="stroke-paper" strokeWidth="1.2" />
        <path d="M302 200l26-31 19 22 14-16 28 25" fill="none" className="stroke-paper" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="410" cy="134" r="7" fill="none" className="stroke-terracotta" strokeWidth="1.2" />
      </g>
      <rect x="290" y="230" width="140" height="5" className="fill-line-strong" />
      <rect x="290" y="242" width="110" height="5" className="fill-line" />
      <rect x="290" y="254" width="124" height="5" className="fill-line" />
      <text x="290" y="286" className="fill-muted font-sans" fontSize="12">
        Scheduled in Buffer
      </text>

      <g className="ms-tag">
        <rect x="276" y="318" width="184" height="32" fill="none" className="stroke-terracotta" strokeWidth="1" />
        <text x="368" y="339" textAnchor="middle" className="fill-terracotta font-sans" fontSize="12">
          Published, file deleted
        </text>
      </g>
    </svg>
  );
}