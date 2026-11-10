import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  saveDraft,
  getDraft,
  clearDraft,
  queueOfflineSubmission,
  getQueuedSubmissions,
  clearQueuedSubmission,
} from '../src/lib/storage';

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageMap.set(key, value);
  },
  removeItem: (key: string) => {
    storageMap.delete(key);
  },
  clear: () => {
    storageMap.clear();
  },
};

describe('Offline Storage and Sync Queue', () => {
  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).localStorage = localStorageMock;
  });

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('saves and retrieves draft code correctly', () => {
    saveDraft('asg-1', 'q-1', 'PYTHON', 'print("hello world")', false);
    const draft = getDraft('asg-1', 'q-1');
    expect(draft).not.toBeNull();
    expect(draft?.code).toBe('print("hello world")');
    expect(draft?.language).toBe('PYTHON');
    expect(draft?.assignmentId).toBe('asg-1');
    expect(draft?.questionId).toBe('q-1');
    expect(draft?.synced).toBe(false);
  });

  it('clears draft after submission', () => {
    saveDraft('asg-2', 'q-2', 'JAVA', 'class Solution {}', true);
    expect(getDraft('asg-2', 'q-2')).not.toBeNull();
    clearDraft('asg-2', 'q-2');
    expect(getDraft('asg-2', 'q-2')).toBeNull();
  });

  it('enqueues offline submissions and manages queue items', () => {
    queueOfflineSubmission({
      assignmentId: 'asg-3',
      questionId: 'q-3',
      language: 'CPP',
      sourceCode: '#include <iostream>',
    });

    const queue = getQueuedSubmissions();
    expect(queue.length).toBe(1);
    expect(queue[0].language).toBe('CPP');
    expect(queue[0].sourceCode).toBe('#include <iostream>');

    clearQueuedSubmission(queue[0].id);
    expect(getQueuedSubmissions().length).toBe(0);
  });
});
