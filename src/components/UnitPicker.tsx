import { useState } from 'react';
import type { UnitDef } from '../types';
import { getUnitColor } from '../types';

interface UnitPickerProps {
  units: UnitDef[];
  onSelect: (unitId: string) => void;
  onCreateUnit: (name: string) => void;
  onDeleteUnit: (unitId: string) => void;
}

export function UnitPicker({ units, onSelect, onCreateUnit, onDeleteUnit }: UnitPickerProps) {
  const [newUnitName, setNewUnitName] = useState('');

  function handleCreate() {
    if (newUnitName.trim() === '') return;
    onCreateUnit(newUnitName);
    setNewUnitName('');
  }

  function handleDeleteUnit(unit: UnitDef, e: React.MouseEvent) {
    e.stopPropagation();
    if (
      window.confirm(
        `Einheit "${unit.name}" wirklich löschen? Alle zugehörigen Übungen und Trainingsdaten dieser Einheit gehen unwiderruflich verloren.`,
      )
    ) {
      onDeleteUnit(unit.id);
    }
  }

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-sm text-neutral-400">Welche Einheit trainierst du an diesem Tag?</p>

      {sortedUnits.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {sortedUnits.map((unit) => {
            const colors = getUnitColor(unit);
            return (
              <div key={unit.id} className={`relative rounded-xl border ${colors.bg} ${colors.border}`}>
                <button
                  onClick={() => onSelect(unit.id)}
                  className={`w-full rounded-xl p-6 text-center font-semibold transition-all duration-150 active:scale-95 hover:brightness-125 ${colors.text}`}
                >
                  {unit.name}
                </button>
                <button
                  onClick={(e) => handleDeleteUnit(unit, e)}
                  className="absolute right-2 top-2 rounded-full p-1 text-xs text-neutral-500 transition-transform active:scale-90 hover:text-red-400"
                  aria-label={`Einheit ${unit.name} löschen`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 border-t border-neutral-800 pt-4">
        <input
          type="text"
          placeholder="Neue Einheit anlegen (z.B. Push/Pull)…"
          value={newUnitName}
          onChange={(e) => setNewUnitName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-3 text-base text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none sm:py-2 sm:text-sm"
        />
        <button
          onClick={handleCreate}
          className="shrink-0 rounded-lg border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-200 transition-transform active:scale-95 hover:bg-neutral-800 sm:py-2"
        >
          Erstellen
        </button>
      </div>
    </div>
  );
}
