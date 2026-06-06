import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, BookOpenCheck, Info, Loader2, SplitSquareHorizontal, X } from 'lucide-react';
import './ComparePage.css';
import { CompareTable } from '../../components/CompareTable/CompareTable';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import { StatsCard } from '../../components/StatsCard/StatsCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { usePlans } from '../../hooks/usePlans';
import { plansApi } from '../../services/api/plans';
import { useAppStore } from '../../store/useAppStore';
import type { PlanComparison } from '../../types/plan';

export const ComparePage = () => {
  const { plans, loading } = usePlans();
  const compareIds = useAppStore((state) => state.compareIds);
  const addToCompare = useAppStore((state) => state.addToCompare);
  const removeFromCompare = useAppStore((state) => state.removeFromCompare);
  const [comparison, setComparison] = useState<PlanComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => compareIds.slice(0, 2), [compareIds]);

  useEffect(() => {
    const compare = async () => {
      if (selected.length < 2) return;
      setComparing(true);
      setError(null);
      try {
        setComparison(await plansApi.compare(selected[0], selected[1]));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Не удалось сравнить планы');
      } finally {
        setComparing(false);
      }
    };
    void compare();
  }, [selected]);

  const chartData = comparison
    ? [
        {
          name: comparison.firstPlan.title,
          common: comparison.summary.commonCount,
          unique: comparison.summary.onlyFirstCount,
        },
        {
          name: comparison.secondPlan.title,
          common: comparison.summary.commonCount,
          unique: comparison.summary.onlySecondCount,
        },
      ]
    : [];

  return (
    <main className="container py-10">
      <div className="mb-8 max-w-3xl">
        <span className="text-sm font-semibold uppercase text-sky-200">Сравнение</span>
        <h1 className="mt-3 text-4xl font-black tracking-normal text-white md:text-5xl">Таблица различий и графики</h1>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_auto]">
          {[0, 1].map((index) => (
            <Select key={index} value={selected[index] ? String(selected[index]) : ''} onValueChange={(value) => addToCompare(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder={`Выберите план ${index + 1}`} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={String(plan.id)}>
                    {plan.title} · {plan.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          <Button variant="secondary" disabled={selected.length < 2 || comparing}>
            {comparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Сравнение
          </Button>
        </CardContent>
      </Card>

      {compareIds.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {compareIds.map((id) => {
            const plan = plans.find((item) => item.id === id);
            return (
              <Button key={id} variant="secondary" size="sm" onClick={() => removeFromCompare(id)}>
                {plan?.title ?? id}
                <X className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      )}

      {error && <div className="mt-5 rounded-md border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

      {loading || comparing ? (
        <div className="mt-10 grid place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-200" />
        </div>
      ) : comparison ? (
        <div className="mt-8 grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatsCard icon={<BarChart3 className="h-5 w-5" />} label="общих дисциплин" value={comparison.summary.commonCount} />
            <StatsCard icon={<BarChart3 className="h-5 w-5" />} label="только в первом" value={comparison.summary.onlyFirstCount} />
            <StatsCard icon={<BarChart3 className="h-5 w-5" />} label="только во втором" value={comparison.summary.onlySecondCount} />
            <StatsCard icon={<BarChart3 className="h-5 w-5" />} label="различий" value={comparison.commonDisciplines.reduce((sum, item) => sum + item.differences.length, 0)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Насколько учебные планы похожи</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="compare-page__chart-layout">
                <div className="compare-page__chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 48 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                      <XAxis
                        dataKey="name"
                        stroke="#cbd5e1"
                        interval={0}
                        tickFormatter={(value: string) =>
                          value.length > 28 ? `${value.slice(0, 28)}...` : value
                        }
                      />
                      <YAxis stroke="#cbd5e1" allowDecimals={false} />
                      <Tooltip
                        formatter={(value, name) => [
                          `${Number(value ?? 0)} дисциплин`,
                          name === 'common' ? 'Совпадают в обоих планах' : 'Есть только в этом плане',
                        ]}
                        labelFormatter={(label) => `Учебный план: ${label}`}
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.14)',
                          borderRadius: 8,
                        }}
                      />
                      <Legend
                        formatter={(value) =>
                          value === 'common' ? 'Общая база' : 'Уникальная специализация'
                        }
                      />
                      <Bar
                        dataKey="common"
                        stackId="disciplines"
                        fill="#22c55e"
                        name="common"
                        radius={[0, 0, 6, 6]}
                      />
                      <Bar
                        dataKey="unique"
                        stackId="disciplines"
                        fill="#38bdf8"
                        name="unique"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="compare-page__chart-notes" aria-label="Пояснения к графику">
                  <div>
                    <BookOpenCheck className="h-5 w-5" />
                    <strong>Общая база</strong>
                    <span>
                      Зеленая часть показывает дисциплины, которые есть в обоих планах. Чем она
                      больше, тем ближе фундамент обучения.
                    </span>
                  </div>
                  <div>
                    <SplitSquareHorizontal className="h-5 w-5" />
                    <strong>Уникальная специализация</strong>
                    <span>
                      Голубая часть показывает дисциплины, которые есть только в выбранном плане.
                      Они сильнее всего отличают траекторию.
                    </span>
                  </div>
                  <div>
                    <Info className="h-5 w-5" />
                    <strong>Как читать</strong>
                    <span>
                      Если уникальных дисциплин много, планы ведут к разным навыкам. Если мало,
                      можно выбирать по форме, году и деталям нагрузки.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Таблица различий</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="compare-page__table-intro">
                Здесь показаны общие дисциплины, у которых отличаются семестр, форма контроля или
                нагрузка. Пояснение в последнем столбце помогает понять, как это может повлиять на
                учебный опыт.
              </p>
              <CompareTable comparison={comparison} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState title="Выберите два плана" text="Добавьте планы из каталога или выберите их в селектах выше." />
        </div>
      )}
    </main>
  );
};
