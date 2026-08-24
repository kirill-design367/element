import { Section, SectionHead } from '@/components/ui/Section';
import { GrainDefs } from '@/components/ui/GrainDefs';
import { Hero } from '@/components/home/Hero';
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
import { COMPANY } from '@/lib/company';
import { plural } from '@/lib/format';

export default function HomePage() {
  return (
    <>
      <GrainDefs />
      <Hero />

      {/* Калькулятор идёт вторым: это главный инструмент сайта, а не финальный
          аккорд. Путь «зашёл — увидел цену» должен быть коротким. */}
      <Section id="raschet">
        <SectionHead
          label="Цены с НДС"
          title="Расчёт стоимости с доставкой"
          lead="Считает на месте: выберите материал, объём и расстояние — цифры пересчитаются сразу. Отправлять ничего не нужно."
        />
        <div className="mt-10 md:mt-14">
          <Calculator />
        </div>
      </Section>

      <Section id="materialy">
        <SectionHead
          label={`${POSITIONS_TOTAL} ${plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')}`}
          title="Материалы"
          lead="Пять групп. Карточка открывает каталог с уже выставленным фильтром."
          aside={
            <ButtonLink href="/catalog/" variant="secondary">
              Весь каталог
            </ButtonLink>
          }
        />
        <div className="mt-10 md:mt-14">
          <CatalogPreview />
        </div>
      </Section>

      {/* Перепад регистра. Тёмная секция ломает монотонность и выделяет
          ровно то, ради чего снабженец вообще читает сайт. */}
      <Section id="usloviya" tone="dark">
        <SectionHead
          label="Отсрочка до 30 дней"
          title="Условия для юридических лиц"
          lead="То, ради чего снабженец меняет поставщика: документы вовремя, отсрочка и один ответственный человек."
        />
        <div className="mt-10 md:mt-14">
          <Terms />
        </div>
      </Section>

      <Section id="process">
        <SectionHead
          label="Ответ за 1 час"
          title="Как работаем"
          lead="От заявки до закрывающих документов — пять шагов и ни одного лишнего согласования."
        />
        <div className="mt-10 md:mt-14">
          <Process />
        </div>
      </Section>

      <Section id="park" tone="dark">
        <SectionHead
          label={`До ${MAX_KM} км от МКАД`}
          title="Парк и объёмы"
          lead="Своя техника и партнёрские перевозчики на пиковых объёмах."
        />
        <div className="mt-10 md:mt-14">
          <Fleet />
        </div>
      </Section>

      <Section id="obyekty">
        <SectionHead
          label="2025 — 2026"
          title="Объекты"
          lead="Что и в каком объёме поставляли за последний год."
        />
        <div className="mt-10 md:mt-14">
          <Objects />
        </div>
      </Section>

      <Section id="zayavka">
        <SectionHead
          label="Имя и телефон"
          title="Заявка на просчёт"
          lead="Ответим ценой на материал и доставку в течение рабочего часа. Держим цену пять дней."
        />
        <div className="mt-10 max-w-[900px] md:mt-14">
          <LeadForm />
        </div>
      </Section>

      <Section id="kontakty">
        <SectionHead label={COMPANY.hoursOffice} title="Контакты" />
        <div className="mt-10 md:mt-14">
          <Contacts />
        </div>
      </Section>
    </>
  );
}
