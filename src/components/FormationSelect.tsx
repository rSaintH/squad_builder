import { Plus } from "lucide-react";
import type { Formation } from "@/lib/types";

interface FormationSelectProps {
  formations: Formation[];
  value: string | null;
  onChange: (formationId: string) => void;
  onNewFormation: () => void;
  disabled?: boolean;
}

export function FormationSelect({
  formations,
  value,
  onChange,
  onNewFormation,
  disabled = false,
}: FormationSelectProps) {
  const defaults = formations.filter((f) => f.is_default);
  const customs = formations.filter((f) => !f.is_default);

  return (
    <div className="flex items-center gap-2">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="glass-surface h-10 flex-1 rounded-lg border px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      >
        <option value="" disabled>
          Escolher formação
        </option>
        <optgroup label="Formações prontas">
          {defaults.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </optgroup>
        {customs.length > 0 && (
          <optgroup label="Formações do clube">
            {customs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <button
        onClick={onNewFormation}
        disabled={disabled}
        title="Nova formação"
        className="glass-surface flex h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:opacity-50"
      >
        <Plus className="h-4 w-4" /> Nova
      </button>
    </div>
  );
}
