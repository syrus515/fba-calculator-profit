
import React from 'react';

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-block group">{children}</div>
);

export const TooltipTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const TooltipContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`absolute bottom-full mb-2 w-max max-w-xs z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200 px-3 py-1.5 text-sm font-medium text-white bg-slate-800 rounded-md shadow-lg ${className}`}>
    {children}
  </div>
);