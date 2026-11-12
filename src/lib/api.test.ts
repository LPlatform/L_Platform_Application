import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}

describe('desktop api transport & contracts', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    const localStorage = createMemoryStorage();
    const events: string[] = [];
    vi.stubGlobal('localStorage', localStorage);
    vi.stubGlobal('window', {
      dispatchEvent: (ev: Event) => {
        events.push(ev.type);
        return true;
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
  });

  it('omits Content-Type header on GET and empty-body POST requests like starting an assessment', async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ attemptId: 'att-1', questions: [], savedAnswers: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = await import('./api');
    await api.fetchCoursesCatalog();
    await api.startCourseAssessment('asmt-ai-m1');

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [, getInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const getHeaders = new Headers(getInit.headers);
    expect(getHeaders.has('Content-Type')).toBe(false);

    const [startUrl, startInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(startUrl).toContain('/api/learning/assessments/asmt-ai-m1/attempts');
    expect(startInit.method).toBe('POST');
    expect(startInit.body).toBeUndefined();
    const startHeaders = new Headers(startInit.headers);
    expect(startHeaders.has('Content-Type')).toBe(false);
  });

  it('sets Content-Type only when submitting non-empty JSON body and omits it on empty submit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'RELEASED', score: 10, totalMarks: 10 }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'GRADED', score: null, totalMarks: 20 }), {
          status: 200,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const api = await import('./api');
    await api.submitCourseAssessment('att-empty');
    await api.submitCourseAssessment('att-with-answers', { q1: 'opt-1' });

    const [, emptyInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(emptyInit.body).toBeUndefined();
    expect(new Headers(emptyInit.headers).has('Content-Type')).toBe(false);

    const [, payloadInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(payloadInit.body).toBe(JSON.stringify({ answers: { q1: 'opt-1' } }));
    expect(new Headers(payloadInit.headers).get('Content-Type')).toBe('application/json');
  });

  it('normalizes multi-type assignment fields and surfaces OCI 503 failure fail-closed', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [{ id: 'asg-1' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'asg-1',
            organizationId: 'org-1',
            sectionId: 'sec-1',
            title: 'AI Case Study',
            description: 'Analyze scenarios',
            assignmentType: 'CASE_STUDY',
            allowFileUpload: true,
            maxFileSizeMb: 5,
            allowResubmit: false,
            totalMarks: 25,
            status: 'PUBLISHED',
            questions: [
              {
                id: 'q-case-1',
                title: 'Bias Mitigation',
                description: 'Describe mitigation',
                questionType: 'SINGLE_MCQ',
                marks: 10,
                options: [{ id: 'o1', optionText: 'Balanced dataset', orderNum: 1 }],
              },
            ],
            mySubmissions: [],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: 'OCI_NOT_CONFIGURED',
            message: 'OCI Object Storage is not configured in this environment.',
          }),
          { status: 503 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const api = await import('./api');
    const assignments = await api.fetchAssignments();
    expect(assignments).toHaveLength(1);
    expect(assignments[0].assignmentType).toBe('CASE_STUDY');
    expect(assignments[0].allowFileUpload).toBe(true);
    expect(assignments[0].allowResubmit).toBe(false);
    expect(assignments[0].questions?.[0].questionType).toBe('SINGLE_MCQ');
    expect(assignments[0].questions?.[0].options?.[0].optionText).toBe('Balanced dataset');

    await expect(
      api.authorizeAttachmentUpload({
        assignmentId: 'asg-1',
        fileName: 'report.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
      }),
    ).rejects.toThrow(/OCI Object Storage is not configured/i);
  });
});
