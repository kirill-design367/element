import type { Metadata } from 'next';
import { CatalogClient } from '@/components/catalog/CatalogClient';
import { PREFILTER_SCRIPT, prefilterCss } from '@/lib/prefilter';
import { META } from '@/lib/meta';

/* Тексты — в lib/meta.ts. */
export const metadata: Metadata = {
  title: META.catalog.title,
  description: META.catalog.description,
};

export default function CatalogPage() {
  return (
    <>
      {/* Оба тега стоят до списка: правила и атрибуты должны появиться
          раньше, чем браузер разберёт карточки. Подробности — lib/prefilter.ts */}
      <style dangerouslySetInnerHTML={{ __html: prefilterCss() }} />
      <script dangerouslySetInnerHTML={{ __html: PREFILTER_SCRIPT }} />
      <CatalogClient />
    </>
  );
}
