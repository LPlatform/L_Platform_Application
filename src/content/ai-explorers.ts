/** "AI Explorers" — a beginner AI course for Class 4–5 students. Bundled so it works offline. */

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // index into options
  explain: string;
}

export interface SortActivity {
  prompt: string;
  groups: [string, string];
  items: Array<{ text: string; group: 0 | 1 }>;
}

export interface Lesson {
  id: string;
  emoji: string;
  title: string;
  minutes: number;
  cards: Array<{ heading: string; text: string; example?: string }>;
  activity: SortActivity;
  quiz: QuizQuestion[];
}

export const PASS_MARK = 3; // out of 4

export const aiExplorersCourse: { title: string; subtitle: string; lessons: Lesson[] } = {
  title: 'AI Explorers',
  subtitle: 'A fun first course about Artificial Intelligence for Class 4 and 5.',
  lessons: [
    {
      id: 'what-is-ai',
      emoji: '🤖',
      title: 'What is AI?',
      minutes: 10,
      cards: [
        {
          heading: 'Machines that can think a little',
          text: 'AI means Artificial Intelligence. "Artificial" means made by people. "Intelligence" means being able to learn and solve problems. So AI is a computer program that can learn and make smart guesses.',
        },
        {
          heading: 'Normal machines follow fixed steps',
          text: 'A fan only turns on and off. A calculator always does the same thing. They do not learn. An AI can look at many examples and get better at a job.',
          example: 'A calculator adds 2 + 2. An AI can look at a photo and say "this is a dog".',
        },
        {
          heading: 'AI is a helper, not a person',
          text: 'AI does not have feelings and it does not really "understand" like you do. It finds patterns. People build AI, and people must check it.',
        },
      ],
      activity: {
        prompt: 'Is it AI or a normal machine? Tap the right group.',
        groups: ['Uses AI', 'Normal machine'],
        items: [
          { text: 'A voice assistant that answers questions', group: 0 },
          { text: 'A light switch', group: 1 },
          { text: 'A phone that unlocks when it sees your face', group: 0 },
          { text: 'A pencil sharpener', group: 1 },
          { text: 'An app that suggests your next cartoon', group: 0 },
        ],
      },
      quiz: [
        {
          question: 'What does AI stand for?',
          options: [
            'Artificial Intelligence',
            'Automatic Internet',
            'Animal Information',
            'Art and Ideas',
          ],
          answer: 0,
          explain: 'AI stands for Artificial Intelligence.',
        },
        {
          question: 'Which one is an example of AI?',
          options: ['A ceiling fan', 'A face-unlock camera on a phone', 'A ruler', 'A door bell'],
          answer: 1,
          explain: 'Face unlock learns what your face looks like — that is AI.',
        },
        {
          question: 'What is the main thing AI does?',
          options: [
            'Feels happy and sad',
            'Finds patterns and makes smart guesses',
            'Grows like a plant',
            'Sleeps at night',
          ],
          answer: 1,
          explain: 'AI finds patterns in examples and uses them to guess.',
        },
        {
          question: 'Who builds AI?',
          options: ['Robots from space', 'Animals', 'People', 'It builds itself from nothing'],
          answer: 2,
          explain: 'People design, build and check AI systems.',
        },
      ],
    },
    {
      id: 'how-ai-learns',
      emoji: '🧠',
      title: 'How does AI learn?',
      minutes: 12,
      cards: [
        {
          heading: 'Learning from examples',
          text: 'You learned what a cat looks like by seeing many cats. AI learns the same way! We show it lots of examples. These examples are called data.',
        },
        {
          heading: 'Training',
          text: 'Showing examples to an AI so it can learn is called training. If we show 1,000 photos of cats and dogs with the right names, the AI starts to notice patterns like pointy ears or long tails.',
          example: 'Photo + label "cat" → AI notices whiskers and pointy ears.',
        },
        {
          heading: 'Good data, good AI',
          text: 'If the examples are wrong or too few, the AI will make mistakes. If we only show black cats, the AI may not know a white cat is also a cat!',
        },
      ],
      activity: {
        prompt: 'Which of these is good data for teaching an AI about fruits?',
        groups: ['Good data', 'Bad data'],
        items: [
          { text: 'A clear photo of an apple labelled "apple"', group: 0 },
          { text: 'A photo of a banana labelled "car"', group: 1 },
          { text: 'Many photos of mangoes of different colours', group: 0 },
          { text: 'A blurry photo with no label', group: 1 },
        ],
      },
      quiz: [
        {
          question: 'What do we call the examples we give to an AI?',
          options: ['Data', 'Toys', 'Batteries', 'Wires'],
          answer: 0,
          explain: 'Examples used to teach AI are called data.',
        },
        {
          question: 'Teaching an AI using examples is called…',
          options: ['Painting', 'Training', 'Charging', 'Printing'],
          answer: 1,
          explain: 'Training is how AI learns from data.',
        },
        {
          question: 'An AI only saw black cats. What might happen?',
          options: [
            'It knows every animal',
            'It may not recognise a white cat',
            'It turns into a cat',
            'Nothing at all',
          ],
          answer: 1,
          explain: 'With too little variety in data, AI makes mistakes.',
        },
        {
          question: 'What helps an AI learn better?',
          options: [
            'Wrong labels',
            'Very few examples',
            'Many correct and varied examples',
            'No examples',
          ],
          answer: 2,
          explain: 'More good, varied data helps AI learn well.',
        },
      ],
    },
    {
      id: 'how-ai-works',
      emoji: '⚙️',
      title: 'How AI works: Input → Think → Output',
      minutes: 10,
      cards: [
        {
          heading: 'Three simple steps',
          text: 'Every AI does three things. Input: it takes in information (a photo, a sound, words). Think: it uses what it learned (the model). Output: it gives an answer.',
        },
        {
          heading: 'Example: a map app',
          text: 'Input: where you are and where you want to go. Think: it checks traffic patterns. Output: the fastest road.',
          example: 'Input 🗺️ → Model 🧠 → Output ➡️ "Turn left"',
        },
        {
          heading: 'The model',
          text: 'The "brain" that AI builds during training is called a model. A model is just patterns stored as numbers inside the computer.',
        },
      ],
      activity: {
        prompt: 'Is it the input or the output?',
        groups: ['Input', 'Output'],
        items: [
          { text: 'You say "What is the weather?"', group: 0 },
          { text: 'The assistant says "It is sunny"', group: 1 },
          { text: 'A photo of a flower', group: 0 },
          { text: 'The label "Sunflower"', group: 1 },
        ],
      },
      quiz: [
        {
          question: 'What are the three steps of AI?',
          options: [
            'Eat, sleep, play',
            'Input, think, output',
            'Start, stop, start',
            'Red, green, blue',
          ],
          answer: 1,
          explain: 'AI takes input, uses its model to think, then gives output.',
        },
        {
          question: 'The "brain" an AI builds while training is called a…',
          options: ['Model', 'Keyboard', 'Screen', 'Mouse'],
          answer: 0,
          explain: 'The learned patterns are called the model.',
        },
        {
          question: 'In a map app, what is the output?',
          options: [
            'Your location',
            'The fastest road to take',
            'The phone battery',
            'The traffic lights',
          ],
          answer: 1,
          explain: 'The answer the app gives you is the output.',
        },
        {
          question: 'A photo you give an AI is the…',
          options: ['Output', 'Input', 'Model', 'Battery'],
          answer: 1,
          explain: 'What goes into the AI is the input.',
        },
      ],
    },
    {
      id: 'ai-around-us',
      emoji: '🏡',
      title: 'AI around us',
      minutes: 8,
      cards: [
        {
          heading: 'You already use AI!',
          text: 'AI is in many things you see every day: video apps that suggest cartoons, voice assistants, face unlock, translation apps and smart cameras.',
        },
        {
          heading: 'AI helps doctors and farmers',
          text: 'AI can help doctors look at X-rays, help farmers know when plants need water, and help scientists predict the weather.',
        },
        {
          heading: 'Not everything is AI',
          text: 'A TV remote or a microwave timer just follows fixed steps. They do not learn from data, so they are not AI.',
        },
      ],
      activity: {
        prompt: 'Where is AI helping? Tap the right group.',
        groups: ['AI helps here', 'No AI needed'],
        items: [
          { text: 'Translating English to Hindi in an app', group: 0 },
          { text: 'Opening a door with a key', group: 1 },
          { text: 'Predicting rain for tomorrow', group: 0 },
          { text: 'Switching on a torch', group: 1 },
        ],
      },
      quiz: [
        {
          question: 'Which app is using AI?',
          options: [
            'A clock that ticks',
            'A video app that suggests cartoons you may like',
            'A paper calendar',
            'A whistle',
          ],
          answer: 1,
          explain: 'Suggestions are made by AI that learns what you like.',
        },
        {
          question: 'How can AI help farmers?',
          options: [
            'By eating crops',
            'By telling when plants need water',
            'By painting the farm',
            'It cannot help',
          ],
          answer: 1,
          explain: 'AI can study weather and soil data to help farmers.',
        },
        {
          question: 'Which one is NOT AI?',
          options: ['Face unlock', 'Voice assistant', 'A microwave timer', 'A translation app'],
          answer: 2,
          explain: 'A timer just counts down; it does not learn.',
        },
        {
          question: 'AI can help doctors by…',
          options: [
            'Looking at X-ray pictures',
            'Cooking food',
            'Driving the ambulance siren',
            'Cleaning floors only',
          ],
          answer: 0,
          explain: 'AI can spot patterns in medical pictures to help doctors.',
        },
      ],
    },
    {
      id: 'what-is-llm',
      emoji: '💬',
      title: 'What is an LLM?',
      minutes: 12,
      cards: [
        {
          heading: 'A chatbot that reads a LOT',
          text: 'LLM means Large Language Model. It is an AI that has read a huge amount of text — like millions of books — so it can write and answer in sentences.',
        },
        {
          heading: 'It guesses the next word',
          text: 'An LLM works like a super game of "finish the sentence". If you write "The sky is…", it guesses the next word is probably "blue". Word by word, it builds a full answer.',
          example: '"Twinkle twinkle little…" → "star" ⭐',
        },
        {
          heading: 'LLMs can be wrong',
          text: 'Because an LLM is guessing, it can sometimes say things that sound right but are not true. Always check important answers with a teacher or a book.',
        },
      ],
      activity: {
        prompt: 'Which word would an LLM most likely guess next?',
        groups: ['Likely next word', 'Unlikely next word'],
        items: [
          { text: '"I brush my…" → teeth', group: 0 },
          { text: '"I brush my…" → elephant', group: 1 },
          { text: '"The sun rises in the…" → east', group: 0 },
          { text: '"The sun rises in the…" → spoon', group: 1 },
        ],
      },
      quiz: [
        {
          question: 'What does LLM stand for?',
          options: [
            'Large Language Model',
            'Little Lion Machine',
            'Long Line Maker',
            'Light Lamp Motor',
          ],
          answer: 0,
          explain: 'LLM means Large Language Model.',
        },
        {
          question: 'How does an LLM make an answer?',
          options: [
            'It copies from a friend',
            'It guesses the next word again and again',
            'It asks a robot',
            'It draws pictures',
          ],
          answer: 1,
          explain: 'An LLM predicts one word at a time.',
        },
        {
          question: 'Can an LLM make mistakes?',
          options: [
            'Never',
            'Yes, so we should check important answers',
            'Only on Sundays',
            'Only in maths',
          ],
          answer: 1,
          explain: 'LLMs can be wrong, so always check.',
        },
        {
          question: 'An LLM learned from…',
          options: ['Lots and lots of text', 'Only one picture', 'Eating apples', 'Music only'],
          answer: 0,
          explain: 'LLMs are trained on huge amounts of text.',
        },
      ],
    },
    {
      id: 'safe-and-kind',
      emoji: '🛡️',
      title: 'Using AI safely and kindly',
      minutes: 10,
      cards: [
        {
          heading: 'Keep your secrets safe',
          text: 'Never tell an AI chatbot your full name, address, phone number, school name or passwords. Keep personal information private.',
        },
        {
          heading: 'Check before you trust',
          text: 'AI can make mistakes or be unfair if it learned from bad data. If something seems strange, ask a grown-up or check another source.',
        },
        {
          heading: 'Use AI to learn, not to cheat',
          text: 'AI can explain things and give ideas. But your homework should show what YOU think. Tell your teacher when you used AI.',
        },
      ],
      activity: {
        prompt: 'Safe or not safe to share with an AI chatbot?',
        groups: ['Safe', 'Not safe'],
        items: [
          { text: '"Explain how plants make food"', group: 0 },
          { text: 'Your home address', group: 1 },
          { text: '"Give me ideas for a science project"', group: 0 },
          { text: 'Your password', group: 1 },
        ],
      },
      quiz: [
        {
          question: 'What should you NEVER share with an AI chatbot?',
          options: [
            'A maths question',
            'Your password',
            'A question about planets',
            'A story idea',
          ],
          answer: 1,
          explain: 'Passwords and personal details must stay private.',
        },
        {
          question: 'If an AI answer seems strange, you should…',
          options: [
            'Believe it anyway',
            'Check with a teacher or a book',
            'Share it with everyone',
            'Shout at the computer',
          ],
          answer: 1,
          explain: 'Always check answers that seem wrong.',
        },
        {
          question: 'What is a good way to use AI for homework?',
          options: [
            'Copy the whole answer',
            'Ask it to explain, then write in your own words',
            'Never read the question',
            'Let it do everything',
          ],
          answer: 1,
          explain: 'Use AI to understand, then show your own thinking.',
        },
        {
          question: 'Why can AI sometimes be unfair?',
          options: [
            'It learned from bad or one-sided data',
            'It is angry',
            'It is hungry',
            'It is sleepy',
          ],
          answer: 0,
          explain: 'AI copies the patterns in its data — even unfair ones.',
        },
      ],
    },
    {
      id: 'talking-to-ai',
      emoji: '✍️',
      title: 'Talking to AI: good prompts',
      minutes: 10,
      cards: [
        {
          heading: 'A prompt is your question',
          text: 'The words you type to an AI are called a prompt. A clear prompt gets a better answer.',
        },
        {
          heading: 'Be clear and give details',
          text: 'Instead of "tell me about animals", try "Tell me 3 fun facts about elephants for a Class 5 student". You said what, how many, and for whom!',
          example:
            'Weak: "write story" → Better: "Write a 5-line funny story about a cat who loves maths"',
        },
        {
          heading: 'You are AI ready!',
          text: 'Now you know what AI is, how it learns, how it works, what an LLM is, how to stay safe and how to ask good questions. Great job, AI Explorer! 🎉',
        },
      ],
      activity: {
        prompt: 'Which prompt is clearer?',
        groups: ['Clear prompt', 'Unclear prompt'],
        items: [
          { text: '"List 3 planets closest to the Sun"', group: 0 },
          { text: '"planets"', group: 1 },
          { text: '"Explain rain in 2 simple sentences"', group: 0 },
          { text: '"tell me stuff"', group: 1 },
        ],
      },
      quiz: [
        {
          question: 'What is a prompt?',
          options: [
            'The words you type to ask an AI',
            'A type of robot',
            'A computer screen',
            'A game controller',
          ],
          answer: 0,
          explain: 'A prompt is your message or question to the AI.',
        },
        {
          question: 'Which is the best prompt?',
          options: [
            '"animals"',
            '"Tell me 3 fun facts about elephants for a Class 5 student"',
            '"hi"',
            '"???"',
          ],
          answer: 1,
          explain: 'It says what, how many and for whom.',
        },
        {
          question: 'Clear prompts usually give…',
          options: ['Worse answers', 'Better answers', 'No answers', 'Only pictures'],
          answer: 1,
          explain: 'Clear details help the AI give a useful answer.',
        },
        {
          question: 'Being "AI ready" means you…',
          options: [
            'Know how AI works and use it safely',
            'Never use computers',
            'Believe everything AI says',
            'Share your password',
          ],
          answer: 0,
          explain: 'AI ready = understand AI and use it wisely and safely.',
        },
      ],
    },
  ],
};

export interface CourseModule {
  id: string;
  title: string;
  badge: string; // emoji badge earned when every lesson in the module is passed
  summary: string;
  lessonIds: string[];
}

/** Lessons grouped into short modules (each ends with a badge). */
export const aiExplorersModules: CourseModule[] = [
  {
    id: 'meet-ai',
    title: 'Meet AI',
    badge: '🌟',
    summary: 'What AI is and where you already see it.',
    lessonIds: ['what-is-ai', 'ai-around-us'],
  },
  {
    id: 'how-ai-thinks',
    title: 'How AI Thinks',
    badge: '🧩',
    summary: 'Data, training and the input → model → output idea.',
    lessonIds: ['how-ai-learns', 'how-ai-works'],
  },
  {
    id: 'chatbots',
    title: 'Chatbots & LLMs',
    badge: '💡',
    summary: 'How chatbots guess words and how to ask good questions.',
    lessonIds: ['what-is-llm', 'talking-to-ai'],
  },
  {
    id: 'responsible-ai',
    title: 'Responsible AI',
    badge: '🛡️',
    summary: 'Staying safe, kind and honest when using AI.',
    lessonIds: ['safe-and-kind'],
  },
];
