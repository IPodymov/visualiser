import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { EducationPlan } from '../../types/plan';

export const RadarStatsCard = ({ plan }: { plan: EducationPlan }) => (
  <Card className="overflow-hidden">
    <CardHeader>
      <CardTitle>Профиль компетенций</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[380px] w-full md:h-[480px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={plan.competencies} outerRadius="72%">
            <PolarGrid gridType="polygon" stroke="rgba(255,255,255,0.18)" radialLines />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#dbeafe', fontSize: 13 }} />
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
