import { useState } from 'react';
import type { CaseData, CaseNode, Choice, DecisionCategory } from '../types/case';

interface Props {
  onBack: () => void;
}

// ─── Form state types ──────────────────────────────────────────────────────────

interface ChoiceForm {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  nextNodeId: string;
  timeAdvanceMin: number;
  scoreDelta: {
    diagnostic: number;
    safety: number;
    time: number;
    cost: number;
    guideline: number;
  };
}

interface NodeForm {
  id: string;
  category: DecisionCategory;
  prompt: string;
  context: string;
  isTerminal: boolean;
  choices: ChoiceForm[];
  expanded: boolean;
}

interface FormState {
  // Step 1
  id: string;
  specialty: string;
  title: string;
  subtitle: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  // Step 2
  age: number;
  sex: 'M' | 'F';
  chiefComplaint: string;
  history: string;
  backgroundHistory: string;
  bp: string;
  hr: number;
  rr: number;
  spo2: number;
  temp: number;
  gcs: number;
  symptoms: string;
  redFlags: string;
  // Step 3
  dmPresenting: string;
  dmRedFlags: string;
  dmBestFirstStep: string;
  dmBestInvestigation: string;
  dmDiagnosis: string;
  dmTreatment: string;
  dmFollowUp: string;
  dmComplications: string;
  dmGuidelineRef: string;
  guidelineTitle: string;
  guidelineBody: string;
  // Step 4
  nodes: NodeForm[];
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultChoice = (): ChoiceForm => ({
  id: '',
  text: '',
  correct: false,
  feedback: '',
  nextNodeId: '',
  timeAdvanceMin: 5,
  scoreDelta: { diagnostic: 0, safety: 0, time: 0, cost: 0, guideline: 0 },
});

const defaultNode = (): NodeForm => ({
  id: '',
  category: 'stabilization',
  prompt: '',
  context: '',
  isTerminal: false,
  choices: [defaultChoice(), defaultChoice()],
  expanded: true,
});

const initialForm: FormState = {
  id: '',
  specialty: 'Cardiology',
  title: '',
  subtitle: '',
  difficulty: 'intermediate',
  estimatedMinutes: 15,
  age: 55,
  sex: 'M',
  chiefComplaint: '',
  history: '',
  backgroundHistory: '',
  bp: '120/80',
  hr: 80,
  rr: 16,
  spo2: 98,
  temp: 37.0,
  gcs: 15,
  symptoms: '',
  redFlags: '',
  dmPresenting: '',
  dmRedFlags: '',
  dmBestFirstStep: '',
  dmBestInvestigation: '',
  dmDiagnosis: '',
  dmTreatment: '',
  dmFollowUp: '',
  dmComplications: '',
  dmGuidelineRef: '',
  guidelineTitle: '',
  guidelineBody: '',
  nodes: [defaultNode()],
};

// ─── Build helper ─────────────────────────────────────────────────────────────

function splitComma(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function buildCaseData(f: FormState): CaseData {
  const nodes: CaseNode[] = f.nodes.map((n) => ({
    id: n.id,
    category: n.category,
    prompt: n.prompt,
    ...(n.context ? { context: n.context } : {}),
    isTerminal: n.isTerminal,
    choices: n.choices.map((c): Choice => ({
      id: c.id,
      text: c.text,
      correct: c.correct,
      feedback: c.feedback,
      nextNodeId: c.nextNodeId,
      timeAdvanceMin: c.timeAdvanceMin,
      scoreDelta: { ...c.scoreDelta },
    })),
  }));

  return {
    id: f.id,
    specialty: f.specialty,
    title: f.title,
    subtitle: f.subtitle,
    difficulty: f.difficulty,
    estimatedMinutes: f.estimatedMinutes,
    patient: {
      age: f.age,
      sex: f.sex,
      chiefComplaint: f.chiefComplaint,
      history: f.history,
      backgroundHistory: f.backgroundHistory,
      initialVitals: {
        bp: f.bp,
        hr: f.hr,
        rr: f.rr,
        spo2: f.spo2,
        temp: f.temp,
        gcs: f.gcs,
      },
      symptoms: splitComma(f.symptoms),
      redFlags: splitComma(f.redFlags),
    },
    startNodeId: f.nodes[0]?.id ?? '',
    nodes,
    diseaseMap: {
      presenting: splitComma(f.dmPresenting),
      redFlags: splitComma(f.dmRedFlags),
      bestFirstStep: f.dmBestFirstStep,
      bestInvestigation: f.dmBestInvestigation,
      diagnosis: f.dmDiagnosis,
      treatment: f.dmTreatment,
      followUp: f.dmFollowUp,
      complications: splitComma(f.dmComplications),
      guidelineRef: f.dmGuidelineRef,
    },
    guideline: {
      title: f.guidelineTitle,
      body: f.guidelineBody,
    },
    availableBadges: [
      {
        id: 'guideline-clean',
        label: 'Guideline Clean',
        icon: '📋',
        description: 'Followed current clinical guidelines throughout the case.',
        positive: true,
      },
      {
        id: 'overtested',
        label: 'Overtested',
        icon: '🔬',
        description: 'Ordered unnecessary investigations, increasing cost and time.',
        positive: false,
      },
      {
        id: 'patient-harmed',
        label: 'Patient Harmed',
        icon: '⚠️',
        description: 'A clinical decision led to avoidable patient harm.',
        positive: false,
      },
    ],
    disclaimer:
      'This game is for educational and entertainment purposes only. It is not medical advice, clinical guidance, or a substitute for professional judgment, local protocols, or current guidelines.',
  };
}

// ─── Shared input styles ───────────────────────────────────────────────────────

const inputCls =
  'bg-slate-800 border border-slate-600 text-slate-100 rounded-lg p-2 w-full focus:outline-none focus:border-slate-400';
const labelCls = 'text-slate-400 text-sm mb-1 block';
const fieldWrap = 'mb-4';

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={fieldWrap}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({
  f,
  set,
}: {
  f: FormState;
  set: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="space-y-1">
      <Field label="Case ID (kebab-case, e.g. stemi-anterior)">
        <input
          className={inputCls}
          value={f.id}
          onChange={(e) => set({ id: e.target.value })}
          placeholder="stemi-anterior"
        />
      </Field>
      <Field label="Specialty">
        <select
          className={inputCls}
          value={f.specialty}
          onChange={(e) => set({ specialty: e.target.value })}
        >
          {[
            'Cardiology',
            'Internal Medicine',
            'Emergency Medicine',
            'ICU',
            'Surgery',
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title">
        <input
          className={inputCls}
          value={f.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Anterior STEMI"
        />
      </Field>
      <Field label="Subtitle (e.g. ACS / STEMI)">
        <input
          className={inputCls}
          value={f.subtitle}
          onChange={(e) => set({ subtitle: e.target.value })}
          placeholder="ACS / STEMI"
        />
      </Field>
      <Field label="Difficulty">
        <select
          className={inputCls}
          value={f.difficulty}
          onChange={(e) =>
            set({
              difficulty: e.target.value as FormState['difficulty'],
            })
          }
        >
          {['beginner', 'intermediate', 'advanced'].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Estimated Minutes">
        <input
          type="number"
          className={inputCls}
          value={f.estimatedMinutes}
          onChange={(e) => set({ estimatedMinutes: Number(e.target.value) })}
        />
      </Field>
    </div>
  );
}

function Step2({
  f,
  set,
}: {
  f: FormState;
  set: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Age">
          <input
            type="number"
            className={inputCls}
            value={f.age}
            onChange={(e) => set({ age: Number(e.target.value) })}
          />
        </Field>
        <Field label="Sex">
          <select
            className={inputCls}
            value={f.sex}
            onChange={(e) => set({ sex: e.target.value as 'M' | 'F' })}
          >
            <option value="M">M</option>
            <option value="F">F</option>
          </select>
        </Field>
      </div>
      <Field label="Chief Complaint">
        <input
          className={inputCls}
          value={f.chiefComplaint}
          onChange={(e) => set({ chiefComplaint: e.target.value })}
        />
      </Field>
      <Field label="History of Presenting Illness">
        <textarea
          className={inputCls}
          rows={3}
          value={f.history}
          onChange={(e) => set({ history: e.target.value })}
        />
      </Field>
      <Field label="Background History (PMH, medications, allergies)">
        <textarea
          className={inputCls}
          rows={3}
          value={f.backgroundHistory}
          onChange={(e) => set({ backgroundHistory: e.target.value })}
        />
      </Field>
      <p className="text-slate-400 text-sm font-medium mt-4 mb-2">
        Initial Vitals
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="BP (e.g. 120/80)">
          <input
            className={inputCls}
            value={f.bp}
            onChange={(e) => set({ bp: e.target.value })}
          />
        </Field>
        <Field label="HR (bpm)">
          <input
            type="number"
            className={inputCls}
            value={f.hr}
            onChange={(e) => set({ hr: Number(e.target.value) })}
          />
        </Field>
        <Field label="RR (breaths/min)">
          <input
            type="number"
            className={inputCls}
            value={f.rr}
            onChange={(e) => set({ rr: Number(e.target.value) })}
          />
        </Field>
        <Field label="SpO2 (%)">
          <input
            type="number"
            className={inputCls}
            value={f.spo2}
            onChange={(e) => set({ spo2: Number(e.target.value) })}
          />
        </Field>
        <Field label="Temp (°C)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={f.temp}
            onChange={(e) => set({ temp: Number(e.target.value) })}
          />
        </Field>
        <Field label="GCS (3–15)">
          <input
            type="number"
            min={3}
            max={15}
            className={inputCls}
            value={f.gcs}
            onChange={(e) => set({ gcs: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Symptoms (comma-separated)">
        <textarea
          className={inputCls}
          rows={2}
          value={f.symptoms}
          onChange={(e) => set({ symptoms: e.target.value })}
          placeholder="chest pain, diaphoresis, nausea"
        />
      </Field>
      <Field label="Red Flags (comma-separated)">
        <textarea
          className={inputCls}
          rows={2}
          value={f.redFlags}
          onChange={(e) => set({ redFlags: e.target.value })}
          placeholder="ST elevation, hypotension"
        />
      </Field>
    </div>
  );
}

function Step3({
  f,
  set,
}: {
  f: FormState;
  set: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-slate-300 text-sm font-semibold mb-3">Disease Map</p>
      <Field label="Presenting Features (comma-separated)">
        <textarea
          className={inputCls}
          rows={2}
          value={f.dmPresenting}
          onChange={(e) => set({ dmPresenting: e.target.value })}
        />
      </Field>
      <Field label="Red Flags (comma-separated)">
        <textarea
          className={inputCls}
          rows={2}
          value={f.dmRedFlags}
          onChange={(e) => set({ dmRedFlags: e.target.value })}
        />
      </Field>
      <Field label="Best First Step">
        <input
          className={inputCls}
          value={f.dmBestFirstStep}
          onChange={(e) => set({ dmBestFirstStep: e.target.value })}
        />
      </Field>
      <Field label="Best Investigation">
        <input
          className={inputCls}
          value={f.dmBestInvestigation}
          onChange={(e) => set({ dmBestInvestigation: e.target.value })}
        />
      </Field>
      <Field label="Diagnosis">
        <input
          className={inputCls}
          value={f.dmDiagnosis}
          onChange={(e) => set({ dmDiagnosis: e.target.value })}
        />
      </Field>
      <Field label="Treatment">
        <input
          className={inputCls}
          value={f.dmTreatment}
          onChange={(e) => set({ dmTreatment: e.target.value })}
        />
      </Field>
      <Field label="Follow-up">
        <input
          className={inputCls}
          value={f.dmFollowUp}
          onChange={(e) => set({ dmFollowUp: e.target.value })}
        />
      </Field>
      <Field label="Complications (comma-separated)">
        <textarea
          className={inputCls}
          rows={2}
          value={f.dmComplications}
          onChange={(e) => set({ dmComplications: e.target.value })}
        />
      </Field>
      <Field label="Guideline Reference (e.g. ESC 2023 STEMI Guidelines)">
        <input
          className={inputCls}
          value={f.dmGuidelineRef}
          onChange={(e) => set({ dmGuidelineRef: e.target.value })}
        />
      </Field>
      <p className="text-slate-300 text-sm font-semibold mt-5 mb-3">
        Guideline Drawer
      </p>
      <Field label="Title">
        <input
          className={inputCls}
          value={f.guidelineTitle}
          onChange={(e) => set({ guidelineTitle: e.target.value })}
        />
      </Field>
      <Field label="Body (full guideline text)">
        <textarea
          className={inputCls}
          rows={6}
          value={f.guidelineBody}
          onChange={(e) => set({ guidelineBody: e.target.value })}
        />
      </Field>
    </div>
  );
}

function ChoiceEditor({
  choice,
  index,
  onUpdate,
  onRemove,
}: {
  choice: ChoiceForm;
  index: number;
  onUpdate: (c: ChoiceForm) => void;
  onRemove: () => void;
}) {
  const u = (patch: Partial<ChoiceForm>) => onUpdate({ ...choice, ...patch });
  const uScore = (patch: Partial<ChoiceForm['scoreDelta']>) =>
    u({ scoreDelta: { ...choice.scoreDelta, ...patch } });

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-300 text-xs font-semibold">
          Choice {index + 1}
        </span>
        <button
          onClick={onRemove}
          className="text-red-400 text-xs hover:text-red-300"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label="Choice ID">
          <input
            className={inputCls}
            value={choice.id}
            onChange={(e) => u({ id: e.target.value })}
            placeholder="choice-ecg"
          />
        </Field>
        <Field label="Next Node ID">
          <input
            className={inputCls}
            value={choice.nextNodeId}
            onChange={(e) => u({ nextNodeId: e.target.value })}
            placeholder="node-next"
          />
        </Field>
      </div>
      <Field label="Choice Text">
        <textarea
          className={inputCls}
          rows={2}
          value={choice.text}
          onChange={(e) => u({ text: e.target.value })}
        />
      </Field>
      <Field label="Feedback">
        <textarea
          className={inputCls}
          rows={2}
          value={choice.feedback}
          onChange={(e) => u({ feedback: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label="Time Advance (min)">
          <input
            type="number"
            className={inputCls}
            value={choice.timeAdvanceMin}
            onChange={(e) => u({ timeAdvanceMin: Number(e.target.value) })}
          />
        </Field>
        <Field label="Correct?">
          <div className="flex items-center mt-1">
            <input
              type="checkbox"
              checked={choice.correct}
              onChange={(e) => u({ correct: e.target.checked })}
              className="mr-2 accent-emerald-500"
            />
            <span className="text-slate-300 text-sm">Mark as correct</span>
          </div>
        </Field>
      </div>
      <p className="text-slate-400 text-xs mb-2">
        Score Deltas (can be negative)
      </p>
      <div className="grid grid-cols-5 gap-1">
        {(
          ['diagnostic', 'safety', 'time', 'cost', 'guideline'] as const
        ).map((key) => (
          <div key={key}>
            <label className="text-slate-500 text-xs capitalize block mb-1">
              {key}
            </label>
            <input
              type="number"
              className="bg-slate-800 border border-slate-600 text-slate-100 rounded p-1 w-full text-sm focus:outline-none"
              value={choice.scoreDelta[key]}
              onChange={(e) => uScore({ [key]: Number(e.target.value) })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeEditor({
  node,
  index,
  onUpdate,
  onRemove,
}: {
  node: NodeForm;
  index: number;
  onUpdate: (n: NodeForm) => void;
  onRemove: () => void;
}) {
  const u = (patch: Partial<NodeForm>) => onUpdate({ ...node, ...patch });

  const updateChoice = (ci: number, c: ChoiceForm) => {
    const choices = [...node.choices];
    choices[ci] = c;
    u({ choices });
  };

  const addChoice = () => {
    if (node.choices.length >= 4) return;
    u({ choices: [...node.choices, defaultChoice()] });
  };

  const removeChoice = (ci: number) => {
    u({ choices: node.choices.filter((_, i) => i !== ci) });
  };

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl mb-4 overflow-hidden">
      <button
        className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-slate-750"
        onClick={() => u({ expanded: !node.expanded })}
      >
        <span className="text-slate-200 font-medium text-sm">
          {index + 1}. {node.id || '(unnamed node)'}{' '}
          <span className="text-slate-500 text-xs ml-1">[{node.category}]</span>
        </span>
        <div className="flex items-center gap-3">
          {node.isTerminal && (
            <span className="text-amber-400 text-xs">TERMINAL</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-red-400 text-xs hover:text-red-300"
          >
            Remove
          </button>
          <span className="text-slate-400 text-xs">
            {node.expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {node.expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Node ID">
              <input
                className={inputCls}
                value={node.id}
                onChange={(e) => u({ id: e.target.value })}
                placeholder="node-stabilize"
              />
            </Field>
            <Field label="Category">
              <select
                className={inputCls}
                value={node.category}
                onChange={(e) =>
                  u({ category: e.target.value as DecisionCategory })
                }
              >
                {(
                  [
                    'stabilization',
                    'history',
                    'investigation',
                    'differential',
                    'diagnosis',
                    'treatment',
                    'disposition',
                    'monitoring',
                  ] as DecisionCategory[]
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Prompt">
            <textarea
              className={inputCls}
              rows={3}
              value={node.prompt}
              onChange={(e) => u({ prompt: e.target.value })}
            />
          </Field>
          <Field label="Context (optional)">
            <textarea
              className={inputCls}
              rows={2}
              value={node.context}
              onChange={(e) => u({ context: e.target.value })}
            />
          </Field>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={node.isTerminal}
              onChange={(e) => u({ isTerminal: e.target.checked })}
              className="mr-2 accent-amber-500"
            />
            <span className="text-slate-300 text-sm">
              Terminal node (ends the case)
            </span>
          </div>

          <p className="text-slate-400 text-sm font-medium mb-2">
            Choices ({node.choices.length}/4)
          </p>
          {node.choices.map((c, ci) => (
            <ChoiceEditor
              key={ci}
              choice={c}
              index={ci}
              onUpdate={(nc) => updateChoice(ci, nc)}
              onRemove={() => removeChoice(ci)}
            />
          ))}
          {node.choices.length < 4 && (
            <button
              onClick={addChoice}
              className="text-emerald-400 text-sm border border-emerald-700 rounded-lg px-3 py-1 hover:bg-emerald-900/30"
            >
              + Add Choice
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Step4({
  f,
  set,
}: {
  f: FormState;
  set: (patch: Partial<FormState>) => void;
}) {
  const updateNode = (i: number, n: NodeForm) => {
    const nodes = [...f.nodes];
    nodes[i] = n;
    set({ nodes });
  };

  const removeNode = (i: number) => {
    set({ nodes: f.nodes.filter((_, idx) => idx !== i) });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-slate-300 text-sm">
          {f.nodes.length} node{f.nodes.length !== 1 ? 's' : ''}. First node
          becomes <code className="text-emerald-400">startNodeId</code>.
        </p>
        <button
          onClick={() => set({ nodes: [...f.nodes, defaultNode()] })}
          className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg px-4 py-1.5"
        >
          + Add Node
        </button>
      </div>
      {f.nodes.map((n, i) => (
        <NodeEditor
          key={i}
          node={n}
          index={i}
          onUpdate={(nn) => updateNode(i, nn)}
          onRemove={() => removeNode(i)}
        />
      ))}
    </div>
  );
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'color:#a3e635'; // number — lime
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'color:#7dd3fc'; // key — sky
          } else {
            cls = 'color:#fca5a5'; // string — red
          }
        } else if (/true|false/.test(match)) {
          cls = 'color:#c084fc'; // bool — purple
        } else if (/null/.test(match)) {
          cls = 'color:#94a3b8'; // null — slate
        }
        return `<span style="${cls}">${match}</span>`;
      }
    );
}

function Step5({ f }: { f: FormState }) {
  const [copied, setCopied] = useState(false);
  const caseData = buildCaseData(f);
  const json = JSON.stringify(caseData, null, 2);
  const highlighted = syntaxHighlight(json);

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${f.id || 'case'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="bg-slate-700 border border-slate-600 rounded-xl p-4 mb-4 text-slate-300 text-sm">
        <p className="font-semibold text-slate-200 mb-1">Next step</p>
        <p>
          Save the exported JSON to{' '}
          <code className="text-emerald-400">
            src/data/cases/{f.specialty.toLowerCase().replace(/\s+/g, '-')}/
            {f.id || '<id>'}.json
          </code>
        </p>
      </div>
      <div className="flex gap-3 mb-4">
        <button
          onClick={copy}
          className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-slate-200 text-sm rounded-lg px-4 py-2"
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={download}
          className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg px-4 py-2"
        >
          Download {f.id || 'case'}.json
        </button>
      </div>
      <div className="bg-slate-950 border border-slate-700 rounded-xl overflow-auto max-h-[480px] p-4">
        <pre
          className="text-xs font-mono leading-5 whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Metadata',
  'Patient',
  'Disease Map',
  'Nodes',
  'Export',
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                  active
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : done
                    ? 'bg-emerald-900 border-emerald-600 text-emerald-300'
                    : 'bg-slate-800 border-slate-600 text-slate-500'
                }`}
              >
                {done ? '✓' : step}
              </div>
              <span
                className={`text-xs mt-1 ${
                  active ? 'text-slate-200' : 'text-slate-600'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`h-0.5 w-8 mx-1 mb-5 ${
                  done ? 'bg-emerald-700' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CaseBuilder({ onBack }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const TOTAL = 5;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200 text-sm"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-slate-100">
          WardRunner Case Builder
        </h1>
        <span className="ml-auto text-slate-500 text-xs">
          Step {step} of {TOTAL}
        </span>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <StepIndicator current={step} />

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-slate-200 font-semibold text-base mb-5">
            {STEP_LABELS[step - 1]}
          </h2>

          {step === 1 && <Step1 f={form} set={patch} />}
          {step === 2 && <Step2 f={form} set={patch} />}
          {step === 3 && <Step3 f={form} set={patch} />}
          {step === 4 && <Step4 f={form} set={patch} />}
          {step === 5 && <Step5 f={form} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-sm rounded-lg px-6 py-2"
          >
            ← Back
          </button>
          {step < TOTAL ? (
            <button
              onClick={() => setStep((s) => Math.min(TOTAL, s + 1))}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg px-6 py-2"
            >
              Next →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
