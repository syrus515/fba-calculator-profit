
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

export const Stat: React.FC<StatProps> = ({ icon, label, value, sub }) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2 text-slate-600">
        <span className="text-indigo-500">{icon}</span>
        <CardTitle className="text-base font-medium">{label}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </CardContent>
  </Card>
);