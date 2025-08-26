import React from 'react';
import { Input } from './Input';
import { Label } from './Label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './Tooltip';
import { Info } from 'lucide-react';
import type { CalculatorInputs } from '../types';

interface FieldProps {
  id: keyof CalculatorInputs;
  label: string;
  value: string;
  onChange: (id: keyof CalculatorInputs, value: string) => void;
  right?: string;
  hint?: string;
  disabled?: boolean;
}

export const Field: React.FC<FieldProps> = ({ id, label, value, onChange, right = "", hint = "", disabled = false }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          (e.target as HTMLElement).blur();
      }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {hint && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger><Info className="h-4 w-4 text-slate-400 hover:text-slate-600" /></TooltipTrigger>
              <TooltipContent className="max-w-xs text-sm">{hint}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input 
            id={id} 
            type="text" 
            autoComplete="off" 
            spellCheck={false} 
            inputMode="decimal" 
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(id, e.target.value)}
            onKeyDown={handleKeyDown}
        />
        {right && <div className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-500 whitespace-nowrap">{right}</div>}
      </div>
    </div>
  );
};
