'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { materialById, type Material } from '@/lib/catalog';
import type { Unit } from '@/lib/pricing';

/**
 * Заявка-список. Снабженец просит просчёт сразу по нескольким позициям —
 * это его рабочий сценарий, а не корзина интернет-магазина.
 *
 * Список живёт только в памяти страницы: sessionStorage не используем
 * по требованию заказчика. Провайдер стоит в корневом layout, поэтому
 * переход между «/» и «/catalog» клиентской навигацией список не роняет.
 */

export interface RequestItem {
  materialId: string;
  amount: number;
  unit: Unit;
}

/** Общие для всех позиций условия поставки: их спрашивают один раз. */
export interface RequestBrief {
  address: string;
  km: number;
  destinationId: string;
  deadline: string;
}

interface RequestApi {
  items: RequestItem[];
  /** Развёрнутые позиции с материалом — чтобы не искать в каждом компоненте. */
  detailed: { item: RequestItem; material: Material }[];
  count: number;
  has: (materialId: string) => boolean;
  add: (materialId: string, amount?: number, unit?: Unit) => void;
  remove: (materialId: string) => void;
  setAmount: (materialId: string, amount: number) => void;
  setUnit: (materialId: string, unit: Unit) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  /** Адрес и срок, введённые в калькуляторе, доезжают до формы заявки. */
  brief: RequestBrief;
  patchBrief: (p: Partial<RequestBrief>) => void;
}

const Ctx = createContext<RequestApi | null>(null);

/** Объём по умолчанию — одна машина. Меньше всё равно не возим. */
const DEFAULT_AMOUNT = 10;

export function RequestProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<RequestBrief>({
    address: '',
    km: 0,
    destinationId: 'mkad',
    deadline: '',
  });

  const patchBrief = useCallback((p: Partial<RequestBrief>) => {
    setBrief((prev) => ({ ...prev, ...p }));
  }, []);

  const add = useCallback((materialId: string, amount = DEFAULT_AMOUNT, unit: Unit = 'm3') => {
    setItems((prev) =>
      prev.some((i) => i.materialId === materialId) ? prev : [...prev, { materialId, amount, unit }],
    );
    setOpen(true);
  }, []);

  const remove = useCallback((materialId: string) => {
    setItems((prev) => prev.filter((i) => i.materialId !== materialId));
  }, []);

  const setAmount = useCallback((materialId: string, amount: number) => {
    setItems((prev) => prev.map((i) => (i.materialId === materialId ? { ...i, amount } : i)));
  }, []);

  const setUnit = useCallback((materialId: string, unit: Unit) => {
    setItems((prev) => prev.map((i) => (i.materialId === materialId ? { ...i, unit } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<RequestApi>(() => {
    const detailed = items
      .map((item) => ({ item, material: materialById(item.materialId) }))
      .filter((x): x is { item: RequestItem; material: Material } => Boolean(x.material));
    return {
      items,
      detailed,
      count: items.length,
      has: (id: string) => items.some((i) => i.materialId === id),
      add,
      remove,
      setAmount,
      setUnit,
      clear,
      open,
      setOpen,
      brief,
      patchBrief,
    };
  }, [items, open, add, remove, setAmount, setUnit, clear, brief, patchBrief]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRequest(): RequestApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRequest вне RequestProvider');
  return ctx;
}
