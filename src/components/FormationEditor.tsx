import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import type { FormationPosition } from "@/lib/types";
import { POSITIONS, type Position } from "@/lib/positions";
import type { PositionDraft } from "@/services/formations";

interface FormationEditorProps {
  open: boolean;
  basePositions: FormationPosition[];
  onClose: () => void;
  onSave: (name: string, positions: PositionDraft[]) => Promise<void> | void;
}

interface EditPos extends PositionDraft {
  key: string;
}

const FIXED_GOALKEEPER: EditPos = {
  key: "fixed-goalkeeper",
  label: "GOL",
  x: 50,
  y: 92,
};

const DEFAULT_OUTFIELD_POSITIONS: EditPos[] = [
  { key: "default-1", label: "LD", x: 15, y: 72 },
  { key: "default-2", label: "ZAG", x: 38, y: 72 },
  { key: "default-3", label: "ZAG", x: 62, y: 72 },
  { key: "default-4", label: "LE", x: 85, y: 72 },
  { key: "default-5", label: "MC", x: 15, y: 48 },
  { key: "default-6", label: "MC", x: 50, y: 48 },
  { key: "default-7", label: "MC", x: 85, y: 48 },
  { key: "default-8", label: "PD", x: 15, y: 20 },
  { key: "default-9", label: "ATA", x: 50, y: 20 },
  { key: "default-10", label: "PE", x: 85, y: 20 },
];

export function FormationEditor({ open, basePositions, onClose, onSave }: FormationEditorProps) {
  const [name, setName] = useState("");
  const [positions, setPositions] = useState<EditPos[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);
  const nextKey = useRef(0);

  useEffect(() => {
    if (open) {
      setName("");
      setSelected(null);
      const outfield = basePositions
        .filter((position) => position.label !== "GOL")
        .slice(0, 10)
        .map((position, index) => ({
          key: `${index}-${position.id}`,
          label: position.label,
          x: Number(position.x),
          y: Number(position.y),
        }));
      setPositions([
        FIXED_GOALKEEPER,
        ...(outfield.length > 0 ? outfield : DEFAULT_OUTFIELD_POSITIONS),
      ]);
    }
  }, [open, basePositions]);

  const clamp = useCallback((v: number) => {
    return Math.max(4, Math.min(96, v));
  }, []);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const idx = dragging.current;
      if (idx === null || !fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const x = clamp(((clientX - rect.left) / rect.width) * 100);
      const y = clamp(((clientY - rect.top) / rect.height) * 100);
      setPositions((prev) => {
        if (prev[idx]?.label === "GOL") return prev;
        return prev.map((p, i) => (i === idx ? { ...p, x, y } : p));
      });
    },
    [clamp],
  );

  useEffect(() => {
    function move(e: PointerEvent) {
      if (dragging.current !== null) {
        e.preventDefault();
        updateFromPointer(e.clientX, e.clientY);
      }
    }
    function up() {
      dragging.current = null;
    }
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [updateFromPointer]);

  function setLabel(idx: number, label: Position) {
    if (positions[idx]?.label === "GOL") return;
    setPositions((prev) => prev.map((p, i) => (i === idx ? { ...p, label } : p)));
  }

  function addPosition() {
    if (positions.length >= 11) return;
    const key = `new-${nextKey.current++}`;
    setPositions((previous) => [
      ...previous,
      {
        key,
        label: "MC",
        x: 50 + ((previous.length % 3) - 1) * 18,
        y: 45,
      },
    ]);
    setSelected(positions.length);
  }

  function removeSelectedPosition() {
    if (selected === null || positions[selected]?.label === "GOL") return;
    setPositions((previous) => previous.filter((_, index) => index !== selected));
    setSelected(null);
  }

  async function handleSave() {
    if (!name.trim() || positions.length !== 11) return;
    setSaving(true);
    try {
      await onSave(
        name.trim(),
        positions.map(({ label, x, y }) => ({
          label,
          x: Math.round(x),
          y: Math.round(y),
        })),
      );
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova formação" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
            Nome da formação
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Meu 4-3-3"
            className="glass-surface w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Arraste as bolinhas e selecione cada uma para definir a posição. O goleiro é fixo.
          </p>
          <span className="glass-surface shrink-0 rounded-full border px-2 py-1 text-xs font-semibold">
            {positions.length}/11
          </span>
        </div>

        <div
          ref={fieldRef}
          className="pitch-bg relative mx-auto aspect-[3/4] w-full max-w-xs touch-none select-none overflow-hidden rounded-xl border border-border"
        >
          <div className="pointer-events-none absolute inset-2 rounded-lg border-2 border-[var(--pitch-line)]" />
          <div className="pointer-events-none absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--pitch-line)]" />
          {positions.map((p, i) => (
            <button
              key={p.key}
              data-editor-position={p.label}
              data-fixed={p.label === "GOL" ? "true" : "false"}
              onPointerDown={() => {
                setSelected(i);
                if (p.label !== "GOL") dragging.current = i;
              }}
              className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[11px] font-bold shadow ${
                p.label === "GOL"
                  ? "cursor-not-allowed border-amber-200 bg-amber-500 text-black"
                  : "cursor-grab active:cursor-grabbing"
              } ${
                selected === i
                  ? "border-white bg-primary text-primary-foreground ring-2 ring-white"
                  : p.label === "GOL"
                    ? ""
                    : "border-white bg-primary/90 text-primary-foreground"
              }`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {p.label === "GOL" ? <Lock className="h-4 w-4" /> : p.label}
            </button>
          ))}
        </div>

        {selected !== null && positions[selected] && (
          <div className="glass-surface rounded-xl border p-3">
            {positions[selected].label === "GOL" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-amber-500" />O goleiro fica fixo no centro da pequena
                área.
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Qual é esta posição?
                  </label>
                  <button
                    onClick={removeSelectedPosition}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {POSITIONS.filter((position) => position !== "GOL").map((pos) => {
                    const active = positions[selected].label === pos;
                    return (
                      <button
                        key={pos}
                        onClick={() => setLabel(selected, pos)}
                        className={`rounded-md border px-1 py-1.5 text-xs font-semibold transition-colors ${
                          active ? "glass-primary" : "glass-surface"
                        }`}
                      >
                        {pos}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {positions.length < 11 && (
          <button
            onClick={addPosition}
            className="glass-surface flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 py-2.5 text-sm font-semibold text-primary"
          >
            <Plus className="h-4 w-4" /> Adicionar bolinha
          </button>
        )}

        {positions.length !== 11 && (
          <p className="text-center text-xs font-medium text-amber-600">
            A formação precisa ter 11 posições contando o goleiro.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={!name.trim() || positions.length !== 11 || saving}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar formação"}
        </button>
      </div>
    </Modal>
  );
}
