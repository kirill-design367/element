import type { Category } from '@/lib/catalog';

/**
 * Плашка фактуры: поле, замощённое россыпью зёрен своей категории.
 * Узор объявлен один раз в GrainDefs — здесь только ссылка на него,
 * поэтому разметка плашки помещается в пару строк и её не жалко
 * копировать целиком при перелёте в каталог.
 */
export function GrainPlate({
  category,
  className = '',
  children,
}: {
  category: Pick<Category, 'id' | 'grain'>;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: category.grain.bg }}
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
        <rect width="100%" height="100%" fill={`url(#grain-${category.id})`} />
      </svg>
      {/* Свет сверху слева, тень снизу справа — поле получает объём. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(115% 85% at 20% 10%, rgba(255,255,255,.4), transparent 62%), radial-gradient(95% 85% at 84% 92%, rgba(23,25,28,.16), transparent 60%)',
        }}
      />
      {children}
    </div>
  );
}
