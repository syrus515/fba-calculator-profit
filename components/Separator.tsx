
import React from 'react';

export const Separator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200 h-[1px] w-full ${className}`} />
);