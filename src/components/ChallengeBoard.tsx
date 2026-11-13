import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleDashed,
  Code2,
  FileText,
  ListChecks,
  Search,
  Timer,
} from 'lucide-react';
import type { Assignment, Question } from '../types';
import { getDraft } from '../lib/storage';
import {
  buildChallenges,
  filterChallenges,
  type Challenge,
  type ChallengeFilters,
} from '../lib/challenges';

interface ChallengeBoardProps {
  assignments: Assignment[];
  loading: boolean;
  onOpenCode: (assignment: Assignment, question: Question) => void;
  onOpenTask: (assignment: Assignment, questionId: string) => void;
  onRefresh: () => void;
}

const KIND_META: Record<
  Challenge['kind'],
  { label: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  code: { label: 'Coding', Icon: Code2 },
  mcq: { label: 'Multiple choice', Icon: ListChecks },
  written: { label: 'Written', Icon: FileText },
};

export const ChallengeBoard: React.FC<ChallengeBoardProps> = ({
  assignments,
  loading,
  onOpenCode,
  onOpenTask,
  onRefresh,
}) => {
  const [filters, setFilters] = useState<ChallengeFilters>({
    query: '',
    status: 'all',
    kinds: [],
    difficulties: [],
    assignmentId: 'all',
  });

  const all = useMemo(
    () => buildChallenges(assignments, (a, q) => Boolean(getDraft(a, q))),
    [assignments],
  );
  const shown = useMemo(() => filterChallenges(all, filters), [all, filters]);
  const solved = all.filter((c) => c.status === 'solved').length;
  const earned = all.reduce((sum, c) => sum + (c.score ?? 0), 0);
  const possible = all.reduce((sum, c) => sum + c.question.points, 0);

  const toggle = (key: 'kinds' | 'difficulties', value: string) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const open = (c: Challenge) =>
    c.kind === 'code'
      ? onOpenCode(c.assignment, c.question)
      : onOpenTask(c.assignment, c.question.id);

  return (
    <div className="hr-board">
      <header className="hr-board-head">
        <div>
          <h1>Challenges</h1>
          <p>Practice problems and classwork from your teachers.</p>
        </div>
        <div className="hr-stats">
          <div>
            <strong>
              {solved}/{all.length}
            </strong>
            <span>Solved</span>
          </div>
          <div>
            <strong>
              {earned}/{possible}
            </strong>
            <span>Points</span>
          </div>
        </div>
      </header>

      <div className="hr-board-grid">
        <section className="hr-list" aria-label="Challenges">
          <label className="hr-search">
            <Search size={16} />
            <input
              placeholder="Search challenges"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            />
          </label>

          {loading && all.length === 0 ? (
            <div className="hr-empty">Loading challenges…</div>
          ) : shown.length === 0 ? (
            <div className="hr-empty">
              {all.length === 0 ? (
                <>
                  <p>No challenges yet. Join a class to get assignments from your teacher.</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={onRefresh}>
                    Refresh
                  </button>
                </>
              ) : (
                <p>No challenges match these filters.</p>
              )}
            </div>
          ) : (
            shown.map((c) => {
              const { Icon, label } = KIND_META[c.kind];
              return (
                <article className="hr-card" key={`${c.assignment.id}:${c.question.id}`}>
                  <div className="hr-card-main">
                    <h3>{c.question.title}</h3>
                    <div className="hr-card-meta">
                      {c.difficulty && (
                        <span className={`hr-diff hr-diff-${c.difficulty}`}>{c.difficulty}</span>
                      )}
                      <span>
                        <Icon size={13} /> {label}
                      </span>
                      <span>Max score: {c.question.points}</span>
                      <span className="hr-muted">{c.assignment.title}</span>
                      {c.assignment.dueDate && (
                        <span className="hr-muted">
                          <Timer size={12} /> Due{' '}
                          {new Date(c.assignment.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hr-card-side">
                    {c.status === 'solved' ? (
                      <span className="hr-status solved">
                        <CheckCircle2 size={14} />{' '}
                        {c.score != null ? `${c.score} pts` : 'Submitted'}
                      </span>
                    ) : c.status === 'attempted' ? (
                      <span className="hr-status attempted">
                        <CircleDashed size={14} /> In progress
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className={`btn btn-sm ${c.status === 'solved' ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => open(c)}
                    >
                      {c.status === 'solved'
                        ? 'Review'
                        : c.status === 'attempted'
                          ? 'Continue'
                          : 'Solve challenge'}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="hr-filters" aria-label="Filters">
          <fieldset>
            <legend>Status</legend>
            {(
              [
                ['all', 'All'],
                ['todo', 'Unsolved'],
                ['attempted', 'In progress'],
                ['solved', 'Solved'],
              ] as const
            ).map(([value, text]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="status"
                  checked={filters.status === value}
                  onChange={() => setFilters({ ...filters, status: value })}
                />
                {text}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Type</legend>
            {(Object.keys(KIND_META) as Challenge['kind'][]).map((k) => (
              <label key={k}>
                <input
                  type="checkbox"
                  checked={filters.kinds.includes(k)}
                  onChange={() => toggle('kinds', k)}
                />
                {KIND_META[k].label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Difficulty</legend>
            {['easy', 'medium', 'hard'].map((d) => (
              <label key={d}>
                <input
                  type="checkbox"
                  checked={filters.difficulties.includes(d)}
                  onChange={() => toggle('difficulties', d)}
                />
                <span className="hr-cap">{d}</span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Assignment</legend>
            <select
              className="select-control"
              value={filters.assignmentId}
              onChange={(e) => setFilters({ ...filters, assignmentId: e.target.value })}
            >
              <option value="all">All assignments</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </fieldset>
        </aside>
      </div>
    </div>
  );
};
