import React, { useState } from 'react';
import { aiExplorersCourse, PASS_MARK, type Lesson } from '../content/ai-explorers';
import { getCourseProgress, saveLessonScore, isLessonUnlocked } from '../lib/course-progress';

type Stage = 'learn' | 'activity' | 'quiz' | 'done';

export const AiCourse: React.FC = () => {
  const [progress, setProgress] = useState(getCourseProgress);
  const [active, setActive] = useState<Lesson | null>(null);
  const lessons = aiExplorersCourse.lessons;
  const doneCount = lessons.filter((l) => (progress[l.id] ?? 0) >= PASS_MARK).length;

  if (active) {
    return (
      <LessonPlayer
        lesson={active}
        onExit={() => setActive(null)}
        onFinished={(score) => setProgress(saveLessonScore(active.id, score))}
      />
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1>{aiExplorersCourse.title}</h1>
        <p>{aiExplorersCourse.subtitle}</p>
        <div className="progress-bar" aria-label={`${doneCount} of ${lessons.length} lessons done`}>
          <span style={{ width: `${(doneCount / lessons.length) * 100}%` }} />
        </div>
        <small>
          {doneCount} of {lessons.length} lessons complete
        </small>
      </header>

      <ol className="lesson-grid">
        {lessons.map((lesson, index) => {
          const score = progress[lesson.id];
          const passed = (score ?? 0) >= PASS_MARK;
          const unlocked = isLessonUnlocked(index, lessons, progress);
          return (
            <li key={lesson.id}>
              <button
                type="button"
                className={`lesson-tile ${passed ? 'is-done' : ''}`}
                disabled={!unlocked}
                onClick={() => setActive(lesson)}
              >
                <span className="lesson-emoji" aria-hidden>
                  {unlocked ? lesson.emoji : '🔒'}
                </span>
                <span className="lesson-num">Lesson {index + 1}</span>
                <strong>{lesson.title}</strong>
                <span className="lesson-meta">
                  {passed
                    ? `✓ Quiz ${score}/4`
                    : score != null
                      ? `Try again (${score}/4)`
                      : `${lesson.minutes} min`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

const LessonPlayer: React.FC<{
  lesson: Lesson;
  onExit: () => void;
  onFinished: (score: number) => void;
}> = ({ lesson, onExit, onFinished }) => {
  const [stage, setStage] = useState<Stage>('learn');
  const [card, setCard] = useState(0);
  const [sorted, setSorted] = useState<Record<number, 0 | 1>>({});
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const steps: Stage[] = ['learn', 'activity', 'quiz', 'done'];

  return (
    <div className="page lesson-player">
      <div className="lesson-top">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExit}>
          ← All lessons
        </button>
        <ol className="stepper" aria-label="Lesson steps">
          {['Learn', 'Activity', 'Quiz'].map((label, i) => (
            <li key={label} className={steps.indexOf(stage) >= i ? 'on' : ''}>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <h1>
        <span aria-hidden>{lesson.emoji}</span> {lesson.title}
      </h1>

      {stage === 'learn' && (
        <section className="card big-card">
          <small>
            {card + 1} / {lesson.cards.length}
          </small>
          <h2>{lesson.cards[card]?.heading}</h2>
          <p>{lesson.cards[card]?.text}</p>
          {lesson.cards[card]?.example && <p className="example">{lesson.cards[card]?.example}</p>}
          <div className="row-end">
            {card > 0 && (
              <button type="button" className="btn btn-secondary" onClick={() => setCard(card - 1)}>
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
        <section className="card big-card">
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

      {stage === 'quiz' && lesson.quiz[q] && (
        <section className="card big-card">
          <small>
            Question {q + 1} of {lesson.quiz.length}
          </small>
          <h2>{lesson.quiz[q]!.question}</h2>
          <div className="options">
            {lesson.quiz[q]!.options.map((opt, i) => {
              const isAnswer = i === lesson.quiz[q]!.answer;
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
                  {opt}
                </button>
              );
            })}
          </div>
          {picked != null && (
            <>
              <p className="explain">
                {picked === lesson.quiz[q]!.answer ? '✓ Correct! ' : '✗ Oops! '}
                {lesson.quiz[q]!.explain}
              </p>
              <div className="row-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setPicked(null);
                    if (q < lesson.quiz.length - 1) {
                      setQ(q + 1);
                    } else {
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
        <section className="card big-card center">
          <div className="score-emoji" aria-hidden>
            {score >= PASS_MARK ? '🏆' : '💪'}
          </div>
          <h2>
            You scored {score} / {lesson.quiz.length}
          </h2>
          <p>
            {score >= PASS_MARK
              ? 'Great work! The next lesson is unlocked.'
              : `You need ${PASS_MARK} correct to pass. Read the lesson again and retry!`}
          </p>
          <div className="row-center">
            {score < PASS_MARK && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStage('learn');
                  setCard(0);
                  setQ(0);
                  setScore(0);
                  setSorted({});
                }}
              >
                Try again
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={onExit}>
              Back to lessons
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
