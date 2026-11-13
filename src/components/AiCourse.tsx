import React, { useMemo, useState } from 'react';
import { ArrowLeft, Award, BookOpen, CheckCircle2, Clock, Lock, Play } from 'lucide-react';
import {
  aiExplorersCourse,
  aiExplorersModules,
  PASS_MARK,
  type Lesson,
} from '../content/ai-explorers';
import { getCourseProgress, saveLessonScore, isLessonUnlocked } from '../lib/course-progress';

type Stage = 'learn' | 'activity' | 'quiz' | 'done';

const lessonById = new Map(aiExplorersCourse.lessons.map((l) => [l.id, l]));
/** Lessons in module order — this is the unlock order. */
const ORDERED: Lesson[] = aiExplorersModules.flatMap((m) =>
  m.lessonIds.map((id) => lessonById.get(id)).filter((l): l is Lesson => Boolean(l)),
);

export const AiCourse: React.FC = () => {
  const [scores, setScores] = useState(getCourseProgress);
  const [active, setActive] = useState<Lesson | null>(null);

  const passed = (id: string) => (scores[id] ?? 0) >= PASS_MARK;
  const doneCount = ORDERED.filter((l) => passed(l.id)).length;
  const percent = Math.round((doneCount / ORDERED.length) * 100);
  const totalMinutes = ORDERED.reduce((s, l) => s + l.minutes, 0);
  const next = ORDERED.find((l, i) => !passed(l.id) && isLessonUnlocked(i, ORDERED, scores));
  const badges = aiExplorersModules.filter((m) => m.lessonIds.every(passed));
  const indexOf = useMemo(() => new Map(ORDERED.map((l, i) => [l.id, i])), []);

  if (active) {
    return (
      <LessonPlayer
        lesson={active}
        position={(indexOf.get(active.id) ?? 0) + 1}
        onExit={() => setActive(null)}
        onFinished={(score) => setScores(saveLessonScore(active.id, score))}
      />
    );
  }

  return (
    <div className="course">
      <section className="course-hero">
        <div className="course-hero-text">
          <span className="course-kicker">Free course · Class 4–5</span>
          <h1>{aiExplorersCourse.title}</h1>
          <p>{aiExplorersCourse.subtitle}</p>
          <div className="course-facts">
            <span>
              <BookOpen size={14} /> {aiExplorersModules.length} modules · {ORDERED.length} lessons
            </span>
            <span>
              <Clock size={14} /> ~{totalMinutes} min
            </span>
            <span>
              <Award size={14} /> {badges.length}/{aiExplorersModules.length} badges
            </span>
          </div>
          {next ? (
            <button type="button" className="btn btn-primary" onClick={() => setActive(next)}>
              <Play size={15} /> {doneCount === 0 ? 'Start course' : `Continue: ${next.title}`}
            </button>
          ) : (
            <span className="course-complete">🎉 Course complete — you are AI ready!</span>
          )}
        </div>
        <div
          className="course-ring"
          style={{ ['--p' as string]: `${percent}` }}
          aria-label={`${percent}% complete`}
        >
          <div>
            <strong>{percent}%</strong>
            <span>complete</span>
          </div>
        </div>
      </section>

      <div className="course-grid">
        <div className="course-modules">
          {aiExplorersModules.map((mod, mi) => {
            const lessons = mod.lessonIds
              .map((id) => lessonById.get(id))
              .filter((l): l is Lesson => Boolean(l));
            const modDone = lessons.filter((l) => passed(l.id)).length;
            return (
              <section className="module-card" key={mod.id}>
                <header>
                  <span className="module-num">Module {mi + 1}</span>
                  <h2>
                    {mod.title}{' '}
                    {modDone === lessons.length && <span title="Badge earned">{mod.badge}</span>}
                  </h2>
                  <p>{mod.summary}</p>
                  <div className="module-bar">
                    <span style={{ width: `${(modDone / lessons.length) * 100}%` }} />
                  </div>
                </header>
                <ol className="module-lessons">
                  {lessons.map((lesson) => {
                    const i = indexOf.get(lesson.id) ?? 0;
                    const unlocked = isLessonUnlocked(i, ORDERED, scores);
                    const score = scores[lesson.id];
                    const done = passed(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          className={`lesson-row ${done ? 'done' : ''}`}
                          disabled={!unlocked}
                          onClick={() => setActive(lesson)}
                        >
                          <span className="lesson-icon" aria-hidden>
                            {done ? (
                              <CheckCircle2 size={18} />
                            ) : unlocked ? (
                              lesson.emoji
                            ) : (
                              <Lock size={15} />
                            )}
                          </span>
                          <span className="lesson-text">
                            <strong>{lesson.title}</strong>
                            <small>
                              {lesson.cards.length} cards · activity · 4-question quiz ·{' '}
                              {lesson.minutes} min
                            </small>
                          </span>
                          <span className="lesson-state">
                            {done
                              ? `Quiz ${score}/4`
                              : score != null
                                ? `Retry (${score}/4)`
                                : unlocked
                                  ? 'Start'
                                  : 'Locked'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <aside className="course-side">
          <div className="side-card">
            <h3>Your badges</h3>
            <div className="badge-grid">
              {aiExplorersModules.map((m) => {
                const got = badges.includes(m);
                return (
                  <div key={m.id} className={`badge ${got ? 'got' : ''}`} title={m.title}>
                    <span>{got ? m.badge : '🔒'}</span>
                    <small>{m.title}</small>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="side-card">
            <h3>How it works</h3>
            <ol className="how-list">
              <li>Read the short cards</li>
              <li>Do the sorting activity</li>
              <li>Pass the quiz ({PASS_MARK}/4) to unlock the next lesson</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
};

const LessonPlayer: React.FC<{
  lesson: Lesson;
  position: number;
  onExit: () => void;
  onFinished: (score: number) => void;
}> = ({ lesson, position, onExit, onFinished }) => {
  const [stage, setStage] = useState<Stage>('learn');
  const [card, setCard] = useState(0);
  const [sorted, setSorted] = useState<Record<number, 0 | 1>>({});
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const totalSteps = lesson.cards.length + 1 + lesson.quiz.length;
  const doneSteps =
    stage === 'learn'
      ? card
      : stage === 'activity'
        ? lesson.cards.length
        : stage === 'quiz'
          ? lesson.cards.length + 1 + q
          : totalSteps;

  const restart = () => {
    setStage('learn');
    setCard(0);
    setQ(0);
    setScore(0);
    setSorted({});
  };

  const steps: Array<{ key: Stage; label: string }> = [
    { key: 'learn', label: 'Learn' },
    { key: 'activity', label: 'Activity' },
    { key: 'quiz', label: 'Quiz' },
  ];
  const stageIndex = stage === 'done' ? 3 : steps.findIndex((s) => s.key === stage);
  const current = lesson.cards[card];
  const question = lesson.quiz[q];

  return (
    <div className="player">
      <header className="player-bar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExit}>
          <ArrowLeft size={15} /> Course
        </button>
        <div className="player-title">
          <span>Lesson {position}</span>
          <strong>
            {lesson.emoji} {lesson.title}
          </strong>
        </div>
        <div className="player-progress" aria-label="Lesson progress">
          <span style={{ width: `${(doneSteps / totalSteps) * 100}%` }} />
        </div>
      </header>

      <div className="player-body">
        <ol className="player-steps">
          {steps.map((s, i) => (
            <li key={s.key} className={i < stageIndex ? 'done' : i === stageIndex ? 'on' : ''}>
              <span>{i < stageIndex ? '✓' : i + 1}</span> {s.label}
            </li>
          ))}
        </ol>

        <div className="player-stage">
          {stage === 'learn' && current && (
            <section className="stage-card">
              <small>
                Card {card + 1} of {lesson.cards.length}
              </small>
              <h2>{current.heading}</h2>
              <p>{current.text}</p>
              {current.example && <p className="example">💡 {current.example}</p>}
              <div className="row-end">
                {card > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCard(card - 1)}
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    card < lesson.cards.length - 1 ? setCard(card + 1) : setStage('activity')
                  }
                >
                  {card < lesson.cards.length - 1 ? 'Next' : 'Start activity'}
                </button>
              </div>
            </section>
          )}

          {stage === 'activity' && (
            <section className="stage-card">
              <small>Activity</small>
              <h2>{lesson.activity.prompt}</h2>
              <ul className="sort-list">
                {lesson.activity.items.map((item, i) => {
                  const choice = sorted[i];
                  const right = choice != null && choice === item.group;
                  return (
                    <li key={item.text} className={choice == null ? '' : right ? 'ok' : 'bad'}>
                      <span>{item.text}</span>
                      <span className="sort-buttons">
                        {lesson.activity.groups.map((g, gi) => (
                          <button
                            key={g}
                            type="button"
                            className={`chip ${choice === gi ? 'chip-on' : ''}`}
                            onClick={() => setSorted({ ...sorted, [i]: gi as 0 | 1 })}
                          >
                            {g}
                          </button>
                        ))}
                      </span>
                      {choice != null && (
                        <em>{right ? 'Correct! 🎉' : 'Not quite — try the other one.'}</em>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="row-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={lesson.activity.items.some((item, i) => sorted[i] !== item.group)}
                  onClick={() => setStage('quiz')}
                >
                  Take the quiz
                </button>
              </div>
            </section>
          )}

          {stage === 'quiz' && question && (
            <section className="stage-card">
              <small>
                Question {q + 1} of {lesson.quiz.length}
              </small>
              <h2>{question.question}</h2>
              <div className="options">
                {question.options.map((opt, i) => {
                  const isAnswer = i === question.answer;
                  const cls = picked == null ? '' : isAnswer ? 'ok' : picked === i ? 'bad' : 'dim';
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`option ${cls}`}
                      disabled={picked != null}
                      onClick={() => {
                        setPicked(i);
                        if (isAnswer) setScore((s) => s + 1);
                      }}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {picked != null && (
                <>
                  <p className={`explain ${picked === question.answer ? 'ok' : 'bad'}`}>
                    {picked === question.answer ? '✓ Correct! ' : '✗ Oops! '}
                    {question.explain}
                  </p>
                  <div className="row-end">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setPicked(null);
                        if (q < lesson.quiz.length - 1) setQ(q + 1);
                        else {
                          onFinished(score);
                          setStage('done');
                        }
                      }}
                    >
                      {q < lesson.quiz.length - 1 ? 'Next question' : 'See my score'}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {stage === 'done' && (
            <section className="stage-card center">
              <div className="score-emoji" aria-hidden>
                {score >= PASS_MARK ? '🏆' : '💪'}
              </div>
              <h2>
                You scored {score} / {lesson.quiz.length}
              </h2>
              <p>
                {score >= PASS_MARK
                  ? 'Great work! The next lesson is unlocked.'
                  : `You need ${PASS_MARK} correct to pass. Read the cards again and retry!`}
              </p>
              <div className="row-center">
                {score < PASS_MARK && (
                  <button type="button" className="btn btn-secondary" onClick={restart}>
                    Try again
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={onExit}>
                  Back to course
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
