import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Paperclip,
  Send,
  Upload,
} from 'lucide-react';
import { authorizeAttachmentUpload, submitAssignmentResponse } from '../lib/api';
import { getQuestionInputKind } from '../lib/student-workspace';
import type { Assignment, Question, Submission } from '../types';

interface MultiTypeAssignmentWorkspaceProps {
  assignment: Assignment;
  initialQuestionId?: string;
  isOnline: boolean;
  onBack: () => void;
  onSubmitted: () => void;
}

export const MultiTypeAssignmentWorkspace: React.FC<MultiTypeAssignmentWorkspaceProps> = ({
  assignment,
  initialQuestionId,
  isOnline,
  onBack,
  onSubmitted,
}) => {
  const nonCodingQuestions = useMemo(
    () =>
      (assignment.questions ?? []).filter(
        (q) => !['PROGRAMMING', 'CODE'].includes((q.questionType ?? '').toUpperCase()),
      ),
    [assignment.questions],
  );

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(() => {
    if (initialQuestionId && nonCodingQuestions.some((q) => q.id === initialQuestionId)) {
      return initialQuestionId;
    }
    return nonCodingQuestions[0]?.id ?? '';
  });

  const activeQuestion: Question | undefined =
    nonCodingQuestions.find((q) => q.id === selectedQuestionId) ?? nonCodingQuestions[0];

  const existingSubmission: Submission | undefined = useMemo(
    () => (assignment.mySubmissions ?? []).find((sub) => sub.questionId === activeQuestion?.id),
    [assignment.mySubmissions, activeQuestion?.id],
  );

  const [textByQuestion, setTextByQuestion] = useState<Record<string, string>>({});
  const [choiceByQuestion, setChoiceByQuestion] = useState<Record<string, string[]>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (!activeQuestion) {
    return (
      <div className="panel-card">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={onBack}
        >
          <ArrowLeft size={14} />
          <span>Back to Assignments</span>
        </button>
        <h3>No non-coding questions in this assignment</h3>
      </div>
    );
  }

  const qType = (activeQuestion.questionType ?? 'SHORT_ANSWER').toUpperCase();
  const kind = getQuestionInputKind(qType);
  const effectiveOptions =
    activeQuestion.options && activeQuestion.options.length > 0
      ? activeQuestion.options
      : qType === 'TRUE_FALSE'
        ? [
            { id: 'true', optionText: 'True', orderNum: 1 },
            { id: 'false', optionText: 'False', orderNum: 2 },
          ]
        : [];

  const textValue = textByQuestion[activeQuestion.id] ?? existingSubmission?.textResponse ?? '';
  const selectedIds = choiceByQuestion[activeQuestion.id] ?? [];
  const resubmitBlocked = Boolean(existingSubmission && assignment.allowResubmit === false);

  const handleToggleChoice = (optId: string) => {
    setError('');
    setChoiceByQuestion((prev) => {
      const current = prev[activeQuestion.id] ?? [];
      if (kind === 'multiple') {
        const next = current.includes(optId)
          ? current.filter((id) => id !== optId)
          : [...current, optId];
        return { ...prev, [activeQuestion.id]: next };
      }
      return { ...prev, [activeQuestion.id]: [optId] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline || resubmitBlocked) return;
    setError('');
    setNotice('');
    setBusy(true);

    try {
      let attachmentPayload:
        | {
            attachmentUrl: string;
            attachmentName: string;
            attachmentMime: string;
            attachmentSizeBytes: number;
          }
        | undefined;

      if (selectedFile) {
        const signed = await authorizeAttachmentUpload({
          assignmentId: assignment.id,
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
          sizeBytes: selectedFile.size,
        });
        const uploadRes = await fetch(signed.uploadUrl, {
          method: 'PUT',
          headers: signed.headers ?? {
            'Content-Type': selectedFile.type || 'application/octet-stream',
          },
          body: selectedFile,
        });
        if (!uploadRes.ok) {
          throw new Error(`Attachment upload failed with status ${uploadRes.status}`);
        }
        attachmentPayload = {
          attachmentUrl: signed.objectKey,
          attachmentName: selectedFile.name,
          attachmentMime: selectedFile.type || 'application/octet-stream',
          attachmentSizeBytes: selectedFile.size,
        };
      }

      if (kind === 'single' || kind === 'multiple') {
        if (selectedIds.length === 0 && !attachmentPayload) {
          throw new Error('Select at least one option before submitting.');
        }
        const chosenTexts = effectiveOptions
          .filter((o) => selectedIds.includes(o.id) || selectedIds.includes(o.optionText))
          .map((o) => o.optionText);
        await submitAssignmentResponse({
          assignmentId: assignment.id,
          questionId: activeQuestion.id,
          textResponse: chosenTexts.join(', ') || undefined,
          responseData:
            kind === 'multiple'
              ? { selectedOptionIds: selectedIds, selectedOptions: chosenTexts }
              : {
                  selectedOptionId: selectedIds[0],
                  selectedOptionText: chosenTexts[0] ?? selectedIds[0],
                },
          ...attachmentPayload,
        });
      } else {
        if (!textValue.trim() && !attachmentPayload) {
          throw new Error('Enter your response or attach a file before submitting.');
        }
        await submitAssignmentResponse({
          assignmentId: assignment.id,
          questionId: activeQuestion.id,
          textResponse: textValue.trim() || undefined,
          responseData: textValue.trim()
            ? { text: textValue.trim(), assignmentType: assignment.assignmentType }
            : undefined,
          ...attachmentPayload,
        });
      }

      setSelectedFile(null);
      setNotice('Your submission has been recorded for review.');
      onSubmitted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to submit response.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="section-header-row">
        <div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 10 }}
            onClick={onBack}
          >
            <ArrowLeft size={14} />
            <span>Back to Assignments</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="pill pill-violet">
              {(assignment.assignmentType || 'ASSIGNMENT').replaceAll('_', ' ')}
            </span>
            {assignment.totalMarks ? (
              <span className="pill tabular-nums">{assignment.totalMarks} total marks</span>
            ) : null}
          </div>
          <h1 style={{ marginTop: 6 }}>{assignment.title}</h1>
          {assignment.description && <p>{assignment.description}</p>}
        </div>
      </div>

      {nonCodingQuestions.length > 1 && (
        <div className="tabs-bar" role="tablist" aria-label="Assignment questions">
          {nonCodingQuestions.map((q, idx) => {
            const hasSub = (assignment.mySubmissions ?? []).some((s) => s.questionId === q.id);
            return (
              <button
                key={q.id}
                type="button"
                role="tab"
                aria-selected={q.id === activeQuestion.id}
                className={`tab-btn ${q.id === activeQuestion.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedQuestionId(q.id);
                  setError('');
                  setNotice('');
                }}
              >
                Q{idx + 1}: {q.title}
                {hasSub ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="inline-banner danger" role="alert">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} />
            {error}
          </span>
        </div>
      )}

      {notice && (
        <div className="inline-banner success">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={15} />
            {notice}
          </span>
        </div>
      )}

      <form className="panel-card" onSubmit={(e) => void handleSubmit(e)}>
        <div className="course-card-top">
          <div>
            <span className="eyebrow">{qType.replaceAll('_', ' ')}</span>
            <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 4 }}>{activeQuestion.title}</h2>
          </div>
          <span className="pill pill-violet tabular-nums">{activeQuestion.points} pts</span>
        </div>

        <p className="reader-prose" style={{ fontSize: 14 }}>
          {activeQuestion.description}
        </p>

        {existingSubmission && (
          <div className="reader-box" style={{ borderColor: 'rgba(16, 185, 129, 0.35)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <strong style={{ fontSize: 13 }}>
                Latest Submission ({existingSubmission.status.replaceAll('_', ' ')})
              </strong>
              <span className="pill pill-success">
                {existingSubmission.feedbackReleasedAt && existingSubmission.score !== null
                  ? `Score: ${existingSubmission.score} / ${activeQuestion.points}`
                  : 'Pending Teacher Review / Release'}
              </span>
            </div>
            {existingSubmission.textResponse && (
              <p className="muted-text" style={{ marginTop: 6, fontSize: 13 }}>
                Submitted response: {existingSubmission.textResponse}
              </p>
            )}
            {existingSubmission.attachmentName && (
              <p className="muted-text" style={{ marginTop: 4, fontSize: 12.5 }}>
                <Paperclip size={12} /> Attached: {existingSubmission.attachmentName}
              </p>
            )}
            {existingSubmission.feedbackReleasedAt && existingSubmission.teacherFeedback && (
              <p style={{ marginTop: 6, fontSize: 13, color: '#a7f3d0' }}>
                Teacher feedback: {existingSubmission.teacherFeedback}
              </p>
            )}
          </div>
        )}

        {(kind === 'single' || kind === 'multiple') && effectiveOptions.length > 0 ? (
          <fieldset style={{ border: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <legend className="sr-only">Select answer options</legend>
            {effectiveOptions.map((opt) => {
              const checked = selectedIds.includes(opt.id);
              return (
                <label key={opt.id} className={`answer-option ${checked ? 'selected' : ''}`}>
                  <input
                    type={kind === 'multiple' ? 'checkbox' : 'radio'}
                    name={`asg-q-${activeQuestion.id}`}
                    checked={checked}
                    disabled={resubmitBlocked}
                    onChange={() => handleToggleChoice(opt.id)}
                  />
                  <span>{opt.optionText}</span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <div className="form-field">
            <label htmlFor={`asg-response-${activeQuestion.id}`}>
              <FileText size={13} style={{ marginRight: 6 }} />
              Your Written / Practical Response
            </label>
            <textarea
              id={`asg-response-${activeQuestion.id}`}
              className="textarea-control"
              rows={6}
              disabled={resubmitBlocked}
              value={textValue}
              onChange={(e) =>
                setTextByQuestion((prev) => ({
                  ...prev,
                  [activeQuestion.id]: e.target.value,
                }))
              }
              placeholder="Write your clear response, analysis, or reasoning here..."
            />
          </div>
        )}

        {assignment.allowFileUpload && (
          <div className="reader-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Upload size={14} style={{ color: '#a78bfa' }} />
              <strong style={{ fontSize: 13 }}>
                File Attachment{' '}
                {assignment.maxFileSizeMb ? `(Max ${assignment.maxFileSizeMb} MB)` : ''}
              </strong>
            </div>
            {assignment.attachmentInstructions && (
              <p className="muted-text" style={{ fontSize: 12.5, marginBottom: 8 }}>
                {assignment.attachmentInstructions}
              </p>
            )}
            <input
              type="file"
              disabled={resubmitBlocked || !isOnline}
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            {selectedFile && (
              <p className="muted-text" style={{ fontSize: 12, marginTop: 6 }}>
                Selected: {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)
              </p>
            )}
          </div>
        )}

        <div className="course-card-footer">
          <span className="muted-text" style={{ fontSize: 12 }}>
            {resubmitBlocked
              ? 'Resubmission is disabled for this assignment.'
              : 'Submitted work is stored for teacher review and feedback.'}
          </span>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isOnline || busy || resubmitBlocked}
          >
            <Send size={14} />
            <span>
              {busy ? 'Submitting…' : existingSubmission ? 'Resubmit Work' : 'Submit Work'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
