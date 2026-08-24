import { Section, SectionHead } from '@/components/ui/Section';
import { Hero } from '@/components/home/Hero';
import { FactsStrip } from '@/components/home/FactsStrip';
import { Calculator } from '@/components/home/Calculator';
import { CatalogPreview } from '@/components/home/CatalogPreview';
import { Terms } from '@/components/home/Terms';
import { Process } from '@/components/home/Process';
import { Fleet } from '@/components/home/Fleet';
import { Objects } from '@/components/home/Objects';
import { LeadForm } from '@/components/home/LeadForm';
import { Contacts } from '@/components/home/Contacts';
import { ButtonLink } from '@/components/ui/Button';
import { MAX_KM } from '@/lib/pricing';
import { POSITIONS_TOTAL } from '@/lib/catalog';
import { plural } from '@/lib/format';

export default function HomePage() {
  return (
    <>
      <Hero />

      <FactsStrip />

      {/* Калькулятор идёт вторым: это главный инструмент сайта, а не финальный
          аккорд. Путь «зашёл — увидел цену» должен быть коротким. */}
      <Section id="raschet" tone="muted">
        <SectionHead
          title="Расчёт стоимости с доставкой"
          lead="Считает на месте: выберите материал, объём и расстояние — цифры пересчитаются сразу. Отправлять ничего не нужно."
        />
        <Calculator />
      </Section>

      <Section id="materialy">
        <SectionHead
          title="Материалы"
          lead={`Пять групп, ${POSITIONS_TOTAL} ${plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')}. Карточка открывает каталог с уже выставленным фильтром.`}
          aside={
            <ButtonLink href="/catalog/" variant="secondary">
              Весь каталог
            </ButtonLink>
          }
        />
        <CatalogPreview />
      </Section>

      <Section id="usloviya" tone="muted">
        <SectionHead
          title="Условия для юридических лиц"
          lead="То, ради чего снабженец меняет поставщика: документы вовремя, отсрочка и один ответственный человек."
        />
        <Terms />
      </Section>

      <Section id="process">
        <SectionHead
          title="Как работаем"
          lead="От заявки до закрывающих документов — пять шагов и ни одного лишнего согласования."
        />
        <Process />
      </Section>

      <Section id="park" tone="muted">
        <SectionHead
          title="Парк и объёмы"
          lead={`Своя техника и партнёрские перевозчики на пиковых объёмах. Возим в пределах ${MAX_KM} км от МКАД.`}
        />
        <Fleet />
      </Section>

      <Section id="obyekty">
        <SectionHead
          title="Объекты"
          lead="Что и в каком объёме поставляли за последний год."
        />
        <Objects />
      </Section>

      <Section id="zayavka" tone="muted">
        <SectionHead
          title="Заявка на просчёт"
          lead="Ответим ценой на материал и доставку в течение рабочего часа. Держим цену пять дней."
        />
        <div className="max-w-[860px]">
          <LeadForm />
        </div>
      </Section>

      <Section id="kontakty">
        <SectionHead title="Контакты" />
        <Contacts />
      </Section>
    </>
  );
}
