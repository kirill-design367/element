import type { Metadata } from 'next';
import { CatalogClient } from '@/components/catalog/CatalogClient';
import { PREFILTER_SCRIPT, prefilterCss } from '@/lib/prefilter';
import { GrainDefs } from '@/components/ui/GrainDefs';

export const metadata: Metadata = {
  title: 'Каталог инертных материалов',
  description:
    'Щебень гранитный, известняковый и гравийный, песок карьерный и мытый, ПГС, отсев, чернозём. Цены за м³ и за тонну, фракции, ГОСТ, наличие.',
};

export default function CatalogPage() {
  return (
    <>
      {/* Оба тега стоят до списка: правила и атрибуты должны появиться
          раньше, чем браузер разберёт карточки. Подробности — lib/prefilter.ts */}
      <style dangerouslySetInnerHTML={{ __html: prefilterCss() }} />
      <script dangerouslySetInnerHTML={{ __html: PREFILTER_SCRIPT }} />
      <GrainDefs />
      <CatalogClient />
    </>
  );
}
