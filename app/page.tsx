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
import { nbsp, plural } from '@/lib/format';
import { COMPANY } from '@/lib/company';

export default function HomePage() {
  return (
    <>
      <Hero />

      <FactsStrip />

      {/* Калькулятор идёт вторым: это главный инструмент сайта, а не финальный
          аккорд. Путь «зашёл — увидел цену» должен быть коротким. */}
      {/* Заголовок с пояснением уходят в узкую колонку у левого края и
          остаются наверху; поля и результат встают ниже во всю ширину. */}
      <Section id="raschet" tone="muted" width="edge" pad="loose">
        <div className="narrow narrow-left mb-10 md:mb-16">
          <SectionHead
            title="Расчёт стоимости с доставкой"
            lead="Считает на месте: выберите материал, объём и расстояние — цифры пересчитаются сразу. Отправлять ничего не нужно."
            stacked
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
          lead={`Пять групп, ${POSITIONS_TOTAL} ${plural(POSITIONS_TOTAL, 'позиция', 'позиции', 'позиций')}. Карточка открывает каталог с уже выставленным фильтром.`}
          aside={
            <ButtonLink href="/catalog/" variant="secondary">
              Весь каталог
            </ButtonLink>
          }
        />
        </div>
        <CatalogPreview />
      </Section>

      {/* Заголовок живёт внутри Terms: он стоит в левой липкой колонке
          рядом с пунктами, а не над блоком во всю ширину. */}
      <Section id="usloviya" tone="muted" width="shell" pad="loose" className="pt-24 md:pt-36">
        <Terms />
      </Section>

      {/* Залипающая последовательность: шаги сменяют друг друга по мере
          прокрутки, поэтому секция во всю ширину и без вертикального воздуха
          снаружи — воздух держит сама сцена. */}
      <Section id="process" width="edge" pad="none">
        <Process />
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

      {/* Финальный аккорд: широкий блок с контрастным фоном во всю ширину
          экрана. Верхние углы скруглены крупно — следующая секция наезжает
          на предыдущую, а не встаёт с ней встык. */}
      <Section id="zayavka" width="edge" pad="none">
        <div className="inv rounded-t-panel py-16 md:py-24">
          <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <h2
                data-lines
                className="font-black text-t4 leading-[1.04] tracking-[-.02em]"
              >
                Заявка на просчёт
              </h2>
              <p className="mt-4 max-w-[34ch] text-t2 leading-relaxed text-ink-2">
                Ответим ценой на материал и доставку в течение рабочего часа. Держим цену
                пять дней.
              </p>
              <a
                href={`tel:${COMPANY.phone}`}
                className="tnum mt-8 inline-flex items-center gap-2 rounded font-black text-t3 leading-none transition-colors duration-300 hover:text-accent"
              >
                {nbsp(COMPANY.phoneLabel)}
              </a>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
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
