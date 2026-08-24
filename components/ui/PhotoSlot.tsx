import type { Category } from '@/lib/catalog';
import { PHOTO, asset } from '@/lib/assets';

/**
 * Место под фотографию материала.
 *
 * Пока снимка нет, слот держится цветом и типографикой: ровное поле в тон
 * материала и фракции моноширинным поверх него. Точечный узор, который был
 * здесь раньше, читался как сгенерированная заглушка — заказчик его снял.
 *
 * Когда PHOTO[slot].src получит путь, на том же месте встанет кадр с
 * заданной пропорцией, и ни одна строка вёрстки вокруг не изменится.
 */
export function PhotoSlot({
  category,
  slot,
  className = '',
  children,
}: {
  category: Pick<Category, 'grain' | 'fractionsLine' | 'name'>;
  /** Ключ в lib/assets.ts. Там же лежит бриф на кадр. */
  slot: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const photo = PHOTO[slot];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: category.grain.bg }}
    >
      {photo?.src ? (
        <img
          src={asset(photo.src)}
          alt={photo.brief}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        /* Название уже набрано под карточкой — для скринридера это повтор,
           здесь оно работает как плакат: цвет материала и его имя, ничего
           больше. Контраст низкий намеренно: это фон, а не содержание. */
        <span
          aria-hidden="true"
          className="font-display absolute inset-0 flex items-end p-4 text-t4 leading-[.85] md:p-5"
          style={{ color: category.grain.tint }}
        >
          {category.name}
        </span>
      )}
      {children}
    </div>
  );
}
