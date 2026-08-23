import type { Category } from '@/lib/catalog';

/**
 * Заглушка вместо фотографии фактуры.
 * Точки рисуются размером с фракцию: у отсева — крошка, у щебня 40–70 —
 * крупная россыпь. Так пустое место всё-таки сообщает о материале.
 * Когда придут снимки, компонент подменит фон на кадр из lib/assets.ts.
 */
export function GrainPlate({
  category,
  className = '',
  scale = 1,
  children,
}: {
  category: Pick<Category, 'grain'>;
  className?: string;
  scale?: number;
  children?: React.ReactNode;
}) {
  const g = category.grain;
  return (
    <div
      aria-hidden="true"
      className={`grain relative overflow-hidden ${className}`}
      style={
        {
          '--grain-bg': g.bg,
          '--grain-tint': g.tint,
          '--grain-tint-2': g.tint2,
          '--grain-rot': `${g.rot}deg`,
          '--grain-dot': `${g.dot * scale}px`,
          '--grain-step': `${g.step * scale}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
