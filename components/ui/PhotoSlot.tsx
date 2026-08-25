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
  slot,
  className = '',
  children,
}: {
  /** Ключ в lib/assets.ts. Там же лежит бриф на кадр. */
  slot: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const photo = PHOTO[slot];

  return (
    /* Фон одинаковый у всех карточек. Раньше он брался из данных материала,
       и у щебня, песка и ПГС подложка была разной светлоты — в ряду это
       читалось как ошибка, а не как признак материала. */
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
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
