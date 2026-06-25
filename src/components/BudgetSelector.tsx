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
  chipClassName = "service-modal-chip service-modal-chip--budget",
  activeClassName = "service-modal-chip--active",
  activeStyle,
  inputClassName = "service-modal-field",
  gridClassName = "grid grid-cols-2 gap-2",
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
            className={`${chipClassName} ${value === b ? activeClassName : ""}`}
            style={value === b ? activeStyle : undefined}
          >
            {b}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSelect(CUSTOM_BUDGET_KEY)}
          className={`${chipClassName} ${isCustom ? activeClassName : ""}`}
          style={isCustom ? activeStyle : undefined}
        >
          + Add Budget
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-cyan-400 shrink-0">{currencySymbol}</span>
          <input
            type="text"
            inputMode="numeric"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={`Enter amount in ${currencyCode}`}
            className={inputClassName}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
