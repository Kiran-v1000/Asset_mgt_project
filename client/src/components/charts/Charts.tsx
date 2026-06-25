import {
  Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { CHART_COLORS } from '../../utils/constants';
import { currency, titleCase } from '../../utils/format';
import type { TrendPoint } from '../../utils/types';

const shortMonth = (m: string) => {
  const [, mm] = m.split('-');
  return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(mm)];
};

export function TrendArea({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="month" tickFormatter={shortMonth} tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <Tooltip
          formatter={(v: number, n: string) => (n === 'spend' ? currency(v, true) : v)}
          labelFormatter={shortMonth}
          contentStyle={{ background: 'rgba(15,23,41,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
          labelStyle={{ color: '#cbd5e1' }}
        />
        <Area type="monotone" dataKey="count" name="Acquired" stroke="#818cf8" strokeWidth={2.5} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({ data }: { data: { status: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number, n: string) => [v, titleCase(n)]}
          contentStyle={{ background: 'rgba(15,23,41,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CategoryBar({ data }: { data: { name: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 10, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={92} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          contentStyle={{ background: 'rgba(15,23,41,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
        />
        <Bar dataKey="count" name="Assets" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
