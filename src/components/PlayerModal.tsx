import { useState } from "react";
import { Modal } from "./Modal";
import { POSITIONS, POSITION_LABELS, type Position } from "@/lib/positions";

interface PlayerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, positions: string[]) => Promise<void> | void;
  initialName?: string;
  initialPositions?: string[];
  title?: string;
}

export function PlayerModal({
  open,
  onClose,
  onSave,
  initialName = "",
  initialPositions = [],
  title = "Adicionar jogador",
}: PlayerModalProps) {
  const [name, setName] = useState(initialName);
  const [positions, setPositions] = useState<string[]>(initialPositions);
  const [saving, setSaving] = useState(false);

  // Re-sync when reopening with new initial values.
  const [lastOpen, setLastOpen] = useState(false);
  if (open && !lastOpen) {
    setName(initialName);
    setPositions(initialPositions);
    setLastOpen(true);
  }
  if (!open && lastOpen) setLastOpen(false);

  function toggle(pos: Position) {
    setPositions((prev) => (prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), positions);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Nome</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Ex.: João"
            className="glass-surface w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            Posições favoritas
          </label>
          <div className="grid grid-cols-3 gap-2">
            {POSITIONS.map((pos) => {
              const active = positions.includes(pos);
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => toggle(pos)}
                  title={POSITION_LABELS[pos]}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition-colors ${
                    active ? "glass-primary" : "glass-surface text-secondary-foreground"
                  }`}
                >
                  {pos}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!name.trim() || saving}
          className="glass-primary w-full rounded-lg border py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}
