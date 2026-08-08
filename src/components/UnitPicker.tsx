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
    <div className="flex min-h-full flex-col gap-7 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-7">
      <div>
        <p className="app-eyebrow">Training planen</p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-neutral-100 light:text-neutral-950">
          Welche Einheit ist heute dran?
        </h3>
        <p className="app-muted mt-2 text-sm font-semibold">
          Wähle einen Split aus oder lege direkt einen neuen an.
        </p>
      </div>

      {sortedUnits.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {sortedUnits.map((unit) => {
            const colors = getUnitColor(unit);
            return (
              <div
                key={unit.id}
                className={`relative overflow-hidden rounded-[2rem] border ${colors.bg} ${colors.border} shadow-xl shadow-black/20`}
              >
                <button
                  onClick={() => onSelect(unit.id)}
                  className="flex min-h-28 w-full items-center justify-between gap-4 px-6 py-6 text-left transition-all duration-150 active:scale-[0.98] hover:brightness-125"
                >
                  <span>
                    <span className="block text-xs font-black uppercase tracking-wide text-neutral-500">
                      Einheit
                    </span>
                    <span className={`mt-2 block text-2xl font-black leading-tight ${colors.text}`}>
                      {unit.name}
                    </span>
                  </span>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${colors.border} bg-neutral-950/30 ${colors.text}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </button>
                <button
                  onClick={(e) => handleDeleteUnit(unit, e)}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-red-500/25 bg-red-950/70 text-red-300/90 shadow-md backdrop-blur transition-transform active:scale-90 hover:bg-red-900 hover:text-red-200"
                  aria-label={`Einheit ${unit.name} löschen`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-3 w-3">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-auto rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 light:border-neutral-200 light:bg-white/70">
        <p className="px-2 pb-3 text-xs font-black uppercase tracking-wide text-neutral-500">Neue Einheit</p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="z.B. Push/Pull"
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="app-input app-input-wide flex-1"
          />
          <button
            onClick={handleCreate}
            className="app-primary-button shrink-0 px-5 py-4 text-sm"
            disabled={newUnitName.trim() === ''}
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
