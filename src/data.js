import { addDays, toKey, uid } from './lib.js';

export const COLORS = ['#1F7AE0', '#2E9E5B', '#C98A00', '#8B4FD8', '#D6455D', '#0F8F96', '#E0701F', '#5A6B7B'];

const TRACKS = [
  {
    id: 'react',
    name: 'React',
    color: COLORS[0],
    topics: [
      'useState and useEffect in depth',
      'useRef, useMemo and useCallback',
      'Context API and useReducer',
      'Custom hooks',
      'React Router',
      'Forms and validation',
      'State management (Redux Toolkit or Zustand)',
      'Data fetching with React Query',
      'Performance: memo, lazy, Suspense',
      'Testing with React Testing Library',
      'TypeScript with React',
      'Next.js basics',
    ],
  },
  {
    id: 'node',
    name: 'Node.js',
    color: COLORS[1],
    topics: [
      'Event loop and async patterns',
      'Modules, npm and package.json',
      'Express routing and middleware',
      'Error handling',
      'JWT authentication',
      'File uploads with Multer',
      'Streams and buffers',
      'Environment config and security basics',
      'CORS and rate limiting',
      'Testing with Jest and Supertest',
      'WebSockets',
      'Background jobs and queues',
    ],
  },
  {
    id: 'python',
    name: 'Python and FastAPI',
    color: COLORS[2],
    topics: [
      'Python data structures and comprehensions',
      'OOP and dunder methods',
      'Decorators and generators',
      'Virtual environments and pip',
      'FastAPI routing, path and query params',
      'Pydantic models and validation',
      'Dependency injection in FastAPI',
      'async and await in FastAPI',
      'SQLAlchemy and Alembic migrations',
      'OAuth2 and JWT auth',
      'Background tasks',
      'Testing with pytest',
      'Dockerizing a FastAPI app',
    ],
  },
  {
    id: 'rest',
    name: 'REST API',
    color: COLORS[3],
    topics: [
      'HTTP methods and status codes',
      'Resource naming and URL design',
      'Pagination, filtering and sorting',
      'API versioning',
      'Authentication: sessions, JWT, OAuth',
      'Idempotency and safe methods',
      'Caching headers and ETags',
      'Consistent error responses',
      'OpenAPI and Swagger docs',
      'CORS',
      'Testing with Postman',
      'REST vs GraphQL',
    ],
  },
  {
    id: 'data',
    name: 'Database and DevOps',
    color: COLORS[4],
    topics: [
      'SQL joins and indexes',
      'Transactions and normalisation',
      'PostgreSQL basics',
      'MongoDB basics',
      'Redis caching',
      'Git branching workflow',
      'Docker basics',
      'CI/CD with GitHub Actions',
      'Deploying on Vercel and Render',
      'Environment variables and secrets',
    ],
  },
  {
    id: 'interview',
    name: 'Interview and System Design',
    color: COLORS[5],
    topics: [
      'JavaScript core: closures, prototypes, this',
      'Promises, async await and the event loop',
      'DSA: arrays and strings',
      'DSA: hash maps and sets',
      'DSA: trees and graphs',
      'DSA: dynamic programming basics',
      'System design fundamentals',
      'Design a URL shortener',
      'Behavioural answers using STAR',
      'Resume and portfolio polish',
      'Mock interviews',
    ],
  },
];

export function seedState() {
  const now = Date.now();
  const day = (n) => toKey(addDays(new Date(), n));

  const tracks = TRACKS.map(({ id, name, color }) => ({ id, name, color }));
  const topics = TRACKS.flatMap((t) =>
    t.topics.map((title, i) => ({ id: `${t.id}-${i}`, trackId: t.id, title, status: 'todo' })),
  );

  const starterTasks = [
    { title: 'Build a todo app with useReducer and Context', trackId: 'react', priority: 'med', status: 'todo', due: day(3) },
    { title: 'Notes REST API with Express and JWT', trackId: 'node', priority: 'high', status: 'doing', due: day(5) },
    { title: 'FastAPI CRUD with SQLAlchemy', trackId: 'python', priority: 'high', status: 'todo', due: day(8) },
    { title: 'Write down an error response format for all endpoints', trackId: 'rest', priority: 'low', status: 'todo', due: '' },
    { title: 'Solve 5 array problems', trackId: 'interview', priority: 'med', status: 'todo', due: day(1) },
  ];
  const tasks = starterTasks.map((t, i) => ({ id: uid(), notes: '', createdAt: now + i, ...t }));

  return {
    version: 1,
    updatedAt: 0,
    settings: { weeklyGoalHours: 10 },
    tracks,
    topics,
    tasks,
    logs: [],
  };
}
