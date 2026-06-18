import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { EducationPlan } from '../../types/plan';

const compactCompetencyLabels: Record<string, string> = {
  Математика: 'Мат.',
  Программирование: 'Прогр.',
  Аналитика: 'Аналит.',
  'Soft Skills': 'Soft',
  Практика: 'Практ.',
};

export const RadarStatsCard = ({ plan }: { plan: EducationPlan }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const compact = chartWidth > 0 && chartWidth < 520;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setChartWidth(entry.contentRect.width);
    });
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Профиль компетенций</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-[320px] w-full sm:h-[380px] md:h-[480px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={plan.competencies}
              outerRadius={compact ? '48%' : '62%'}
              margin={{ top: 28, right: compact ? 30 : 44, bottom: 28, left: compact ? 30 : 44 }}
            >
              <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.18)" radialLines />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: '#dbeafe', fontSize: compact ? 11 : 13 }}
                tickFormatter={(value: string) => (compact ? compactCompetencyLabels[value] ?? value : value)}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 8,
                  color: '#fff',
                }}
              />
              <Radar
                dataKey="value"
                stroke="#8b5cf6"
                fill="#38bdf8"
                fillOpacity={0.35}
                strokeWidth={3}
                dot={{ r: 4, fill: '#e0f2fe' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
