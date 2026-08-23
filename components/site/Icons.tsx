/**
 * Иконки нарисованы вручную и встроены в разметку.
 * Отступление осознанное: их четыре штуки, а любая библиотека — это
 * дополнительный рантайм в бандле. На сайте, где планка PageSpeed 90+
 * на мобильной, 400 байт путей выигрывают у пакета.
 */

type P = { className?: string };
const common = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const PhoneIcon = ({ className }: P) => (
  <svg {...common} className={className}>
    <path d="M5 3h3.5l1.6 4-2.1 1.4a12 12 0 0 0 5.6 5.6L15 11.9l4 1.6V17c0 1.1-.9 2-2 2A14 14 0 0 1 3 5c0-1.1.9-2 2-2Z" />
  </svg>
);

export const ArrowIcon = ({ className }: P) => (
  <svg {...common} className={className}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = ({ className }: P) => (
  <svg {...common} className={className} strokeWidth={2}>
    <path d="M4 12.5 9.5 18 20 6.5" />
  </svg>
);

export const CloseIcon = ({ className }: P) => (
  <svg {...common} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ListIcon = ({ className }: P) => (
  <svg {...common} className={className}>
    <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
);
