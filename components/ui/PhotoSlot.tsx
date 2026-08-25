import type { Category } from '@/lib/catalog';
import { PHOTO } from '@/lib/assets';
import { Photo } from './Photo';

/**
 * Место под фотографию материала.
 *
 * Пока снимка нет, слот держится цветом: ровное поле в тон материала, без
 * единого знака поверх. Точечный узор, который был здесь раньше, читался как
 * сгенерированная заглушка, а надпись поверх поля дублировала название
 * карточки и не проходила по контрасту — типографику держит сама карточка.
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
  category: Pick<Category, 'grain'>;
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
      {photo?.file && (
        <Photo
          file={photo.file}
          alt={photo.brief}
          /* Карточка ленты: 30% контейнера на широком экране, почти вся
             ширина на телефоне. По этим числам браузер и выбирает файл. */
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 78vw"
          className="absolute inset-0"
          imgClassName="photo-zoom"
        />
      )}
      {children}
    </div>
  );
}
