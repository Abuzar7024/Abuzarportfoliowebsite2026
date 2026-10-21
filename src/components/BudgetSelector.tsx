import React from "react";
import { CUSTOM_BUDGET_KEY } from "../lib/user-session";

interface BudgetSelectorProps {
  budgets: string[];
  value: string;
  customValue: string;
  currencySymbol: string;
  currencyCode: string;
  onSelect: (budget: string) => void;
  onCustomChange: (value: string) => void;
  chipClassName?: string;
  activeClassName?: string;
  activeStyle?: React.CSSProperties;
  inputClassName?: string;
  gridClassName?: string;
}

export function BudgetSelector({
  budgets,
  value,
  customValue,
  currencySymbol,
  currencyCode,
  onSelect,
  onCustomChange,
  chipClassName = "seg w-full text-left",
  activeClassName = "",
  activeStyle,
  inputClassName = "input",
  gridClassName = "grid grid-cols-2 gap-2 sm:grid-cols-3",
}: BudgetSelectorProps) {
  const isCustom = value === CUSTOM_BUDGET_KEY;

  return (
    <div className="space-y-3">
      <div className={gridClassName}>
        {budgets.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => onSelect(b)}
            aria-pressed={value === b}
            className={`${chipClassName} ${value === b ? activeClassName : ""}`}
            style={value === b ? activeStyle : undefined}
          >
            {b}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSelect(CUSTOM_BUDGET_KEY)}
          aria-pressed={isCustom}
          className={`${chipClassName} ${isCustom ? activeClassName : ""}`}
          style={isCustom ? activeStyle : undefined}
        >
          Other amount
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-mono text-sm text-silver">{currencySymbol}</span>
          <input
            type="text"
            inputMode="numeric"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={`Amount in ${currencyCode}`}
            aria-label={`Budget amount in ${currencyCode}`}
            className={inputClassName}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
