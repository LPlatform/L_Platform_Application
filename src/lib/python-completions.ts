import {
  snippetCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';

const fn = (label: string, detail: string, info: string): Completion => ({
  label,
  type: 'function',
  detail,
  info,
  apply: `${label}()`,
  boost: 2,
});

export const PYTHON_BUILTINS: Completion[] = [
  fn('print', '(*values)', 'Show values on the screen.'),
  fn('input', '(prompt)', 'Read a line typed by the user as text.'),
  fn('len', '(obj)', 'Number of items in a list, string or dict.'),
  fn('range', '(start, stop, step)', 'A sequence of numbers, often used in for loops.'),
  fn('int', '(x)', 'Convert to a whole number.'),
  fn('float', '(x)', 'Convert to a decimal number.'),
  fn('str', '(x)', 'Convert to text.'),
  fn('bool', '(x)', 'Convert to True or False.'),
  fn('list', '(iterable)', 'Create a list.'),
  fn('dict', '(**kwargs)', 'Create a dictionary.'),
  fn('set', '(iterable)', 'Create a set of unique items.'),
  fn('tuple', '(iterable)', 'Create a tuple.'),
  fn('sum', '(iterable)', 'Add up all numbers.'),
  fn('min', '(iterable)', 'Smallest item.'),
  fn('max', '(iterable)', 'Largest item.'),
  fn('abs', '(x)', 'Absolute value.'),
  fn('round', '(number, ndigits)', 'Round a number.'),
  fn('sorted', '(iterable)', 'Return a new sorted list.'),
  fn('reversed', '(seq)', 'Iterate in reverse order.'),
  fn('enumerate', '(iterable)', 'Pairs of (index, item).'),
  fn('zip', '(*iterables)', 'Combine items from several lists.'),
  fn('map', '(func, iterable)', 'Apply a function to every item.'),
  fn('filter', '(func, iterable)', 'Keep items where func is True.'),
  fn('type', '(obj)', 'The type of an object.'),
  fn('isinstance', '(obj, cls)', 'Check the type of an object.'),
  fn('open', '(file, mode)', 'Open a file.'),
  fn('any', '(iterable)', 'True if any item is True.'),
  fn('all', '(iterable)', 'True if all items are True.'),
];

const KEYWORDS = [
  'False',
  'None',
  'True',
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
].map<Completion>((label) => ({ label, type: 'keyword' }));

const SNIPPETS: Completion[] = [
  snippetCompletion('def ${name}(${params}):\n\t${pass}', {
    label: 'def',
    detail: 'function',
    type: 'keyword',
    boost: 3,
  }),
  snippetCompletion('for ${item} in ${items}:\n\t${pass}', {
    label: 'for',
    detail: 'loop',
    type: 'keyword',
    boost: 3,
  }),
  snippetCompletion('for ${i} in range(${n}):\n\t${pass}', {
    label: 'forr',
    detail: 'for … in range',
    type: 'keyword',
  }),
  snippetCompletion('while ${condition}:\n\t${pass}', {
    label: 'while',
    detail: 'loop',
    type: 'keyword',
    boost: 3,
  }),
  snippetCompletion('if ${condition}:\n\t${pass}', {
    label: 'if',
    detail: 'block',
    type: 'keyword',
    boost: 3,
  }),
  snippetCompletion('if ${condition}:\n\t${pass}\nelse:\n\t${pass}', {
    label: 'ifelse',
    detail: 'if … else',
    type: 'keyword',
  }),
  snippetCompletion('try:\n\t${pass}\nexcept ${Exception} as e:\n\t${print(e)}', {
    label: 'try',
    detail: 'try … except',
    type: 'keyword',
    boost: 3,
  }),
  snippetCompletion('class ${Name}:\n\tdef __init__(self${, args}):\n\t\t${pass}', {
    label: 'class',
    detail: 'class',
    type: 'keyword',
    boost: 3,
  }),
  snippetCompletion("if __name__ == '__main__':\n\t${main()}", {
    label: 'main',
    detail: "if __name__ == '__main__'",
    type: 'keyword',
  }),
  snippetCompletion('print(f"${text}")', {
    label: 'printf',
    detail: 'print f-string',
    type: 'function',
  }),
];

export const MODULE_MEMBERS: Record<string, string[]> = {
  math: [
    'sqrt',
    'pow',
    'floor',
    'ceil',
    'pi',
    'e',
    'sin',
    'cos',
    'tan',
    'log',
    'factorial',
    'gcd',
    'fabs',
  ],
  random: ['randint', 'random', 'choice', 'shuffle', 'sample', 'uniform', 'seed'],
  time: ['sleep', 'time', 'perf_counter'],
  string: ['ascii_letters', 'ascii_lowercase', 'ascii_uppercase', 'digits', 'punctuation'],
};

const STRING_METHODS = [
  'upper',
  'lower',
  'strip',
  'split',
  'join',
  'replace',
  'find',
  'startswith',
  'endswith',
  'count',
  'format',
  'title',
  'isdigit',
  'isalpha',
];
const LIST_METHODS = [
  'append',
  'extend',
  'insert',
  'remove',
  'pop',
  'clear',
  'index',
  'sort',
  'reverse',
  'copy',
];
const DICT_METHODS = ['keys', 'values', 'items', 'get', 'update', 'setdefault'];

const memberCompletions = (names: string[], type = 'method'): Completion[] =>
  names.map((label) => ({ label, type, apply: type === 'method' ? `${label}()` : label }));

/** Static completion source (builtins, keywords, snippets, module and object members). */
export function pythonCompletions(context: CompletionContext): CompletionResult | null {
  const member = context.matchBefore(/[A-Za-z_][\w]*\.\w*$/);
  if (member) {
    const [object = ''] = member.text.split('.');
    const from = member.from + object.length + 1;
    const known = MODULE_MEMBERS[object];
    const options = known
      ? memberCompletions(known, 'property').map((o) => ({ ...o, type: 'function' }))
      : memberCompletions([...new Set([...STRING_METHODS, ...LIST_METHODS, ...DICT_METHODS])]);
    return { from, options, validFor: /^\w*$/ };
  }

  const word = context.matchBefore(/\w+/);
  if (!word && !context.explicit) return null;
  if (word && word.text.length < 1) return null;
  return {
    from: word ? word.from : context.pos,
    options: [...SNIPPETS, ...PYTHON_BUILTINS, ...KEYWORDS],
    validFor: /^\w*$/,
  };
}
