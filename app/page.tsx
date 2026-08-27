import { Section, SectionHead } from '@/components/ui/Section';
import { Hero } from '@/components/home/Hero';
import { FactsStrip } from '@/components/home/FactsStrip';
import { Calculator } from '@/components/home/Calculator';
import { CatalogPreview } from '@/components/home/CatalogPreview';
import { Metal } from '@/components/home/Metal';
import { Workflow } from '@/components/home/Workflow';
import { Fleet } from '@/components/home/Fleet';
import { Objects } from '@/components/home/Objects';
import { LeadForm } from '@/components/home/LeadForm';
import { Contacts } from '@/components/home/Contacts';
import { ButtonLink } from '@/components/ui/Button';
import { MAX_KM } from '@/lib/pricing';
import { CATEGORIES, POSITIONS_TOTAL } from '@/lib/catalog';
import { nbsp, plural } from '@/lib/format';
import { COMPANY } from '@/lib/company';

export default function HomePage() {
  return (
    <>
      <Hero />

      <FactsStrip />

      {/* Калькулятор идёт вторым: это главный инструмент сайта, а не финальный
          аккорд. Путь «зашёл — увидел цену» должен быть коротким.

          Заголовок компактный и стоит над обеими колонками, воздух секции
          уменьшен: весь блок обязан помещаться в один экран на 1920×1080 —
          цифру нельзя искать прокруткой. */}
      <Section id="raschet" tone="muted" width="shell" pad="normal">
        {/* Обёртка max-w-[46ch] отсюда снята: она резала колонку до ~380 px,
            и длинный заголовок вставал в три строки. Ограничение было нужно
            пояснению, а у него свой предел в 54 знака внутри SectionHead.
            Заголовку дана полная ширина — на десктопе он встаёт в одну
            строку, на 1512 и уже переносится сам. */}
        <div className="mb-8 md:mb-10">
          <SectionHead
            title="Расчёт объёма, рейсов и цены"
            lead="Выберите материал и объём — цену и число рейсов увидите сразу."
            stacked
            wideTitle
          />
        </div>
        <Calculator />
      </Section>

      {/* Заголовок и кнопка стоят в контейнере, лента уходит навылет.
          Нижний отступ отрицательный: карточки ленты заходят на следующую
          секцию — второй тип перехода, без скруглений и без смены фона. */}
      <Section id="materialy" width="edge" pad="normal" className="relative z-10 -mb-20 pb-0 md:-mb-28 md:pb-0">
        <div className="shell">
        <SectionHead
          title="Материалы"
          lead={`${CATEGORIES.length} ${plural(CATEGORIES.length, 'группа', 'группы', 'групп')}, ${POSITIONS_TOTAL} ${plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')}.`}
          aside={
            <ButtonLink href="/catalog/" variant="secondary">
              Весь каталог
            </ButtonLink>
          }
        />
        </div>
        <CatalogPreview />
      </Section>

      {/* Порядок работы и условия — одна секция с двумя дорожками. Раньше
          это были два блока подряд, и оба закреплялись: человек крутил, а
          страница стояла. Закрепления нет, секция едет вместе со страницей и
          слегка сползает по прокрутке. Оба якоря на месте: usloviya на
          секции, process на дорожке шагов. */}
      {/* Анонс металлопроката. Стоит сразу под лентой, поэтому именно он
          принимает на себя наезд карточек: секция «Материалы» выше стоит с
          отрицательным нижним полем (-mb-20 md:-mb-28), и штатный верхний
          отступ съедался бы этим наездом целиком. pt-36 md:pt-52 — ровно на
          величину наезда плюс обычный воздух. */}
      <Section id="metall" width="edge" pad="normal" className="pt-36 md:pt-52">
        <Metal />
      </Section>

      {/* Порядок работы и условия. Наезд ленты сюда больше не доходит —
          между ними стоит анонс металла, — поэтому воздух обычный. */}
      <Section tone="muted" width="edge" pad="normal">
        <Workflow />
      </Section>

      {/* Полноэкранный блок: одно число и фон, больше ничего. Заголовок
          секции снят намеренно — на этом экране он был бы четвёртым
          элементом там, где должно быть два. */}
      <Section id="park" width="edge" pad="none">
        <Fleet />
      </Section>

      {/* Заголовок живёт внутри Objects: он стоит в левой колонке рядом со
          списком, а не над блоком во всю ширину. */}
      <Section id="obyekty" width="edge" pad="tight">
        <Objects />
      </Section>

      {/* Финальный аккорд, но не плита во весь экран: карточка внутри
          страницы — поля от краёв, скругление со всех четырёх сторон, фон
          тёмно-серый с синим оттенком, а не чёрный. */}
      <Section id="zayavka" width="shell" pad="tight">
        {/* Вертикальный воздух урезан вдвое: было py-8 md:py-12, стало
            py-5 md:py-6. Поля формы при этом не тронуты — высота поля
            по-прежнему 44 px, отбивка между полями прежняя. */}
        <div className="lead-band rounded-panel px-5 py-5 md:px-10 md:py-6">
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <h2 data-reveal className="font-black text-t4 leading-[1.02] tracking-[-.02em]">
                Заявка на просчёт
              </h2>
              {/* Абзац про срок брони цены убран решением заказчика. Отбивка
                  телефона оставлена прежней: 24 px от заголовка — обычный шаг
                  проекта, дырой не читается. */}
              <a
                href={`tel:${COMPANY.phone}`}
                className="mt-6 inline-flex items-center gap-2 rounded font-black text-t3 leading-none transition-colors duration-300 hover:text-accent"
              >
                {nbsp(COMPANY.phoneLabel)}
              </a>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              <LeadForm />
            </div>
          </div>
        </div>
      </Section>

      {/* Заголовок живёт внутри Contacts: телефон крупный и отдельно,
          реквизиты в раскрывающемся блоке, карта во всю ширину экрана. */}
      <Section id="kontakty" tone="muted" width="edge" pad="normal">
        <Contacts />
      </Section>
    </>
  );
}
