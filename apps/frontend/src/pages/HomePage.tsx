import { Server, Code, Database, Lock, Zap, CheckCircle2, Boxes, Rocket } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Server,
      title: 'Backend with Fastify',
      description: 'High-performance Node.js server with TypeScript, TypeBox validation, and structured logging.',
    },
    {
      icon: Code,
      title: 'Frontend with React',
      description: 'Modern React 19 with TypeScript, Tailwind CSS, React Router, and beautiful Radix UI components.',
    },
    {
      icon: Database,
      title: 'PostgreSQL & Drizzle ORM',
      description: 'Type-safe database queries with Drizzle ORM, migrations, and connection pooling built-in.',
    },
    {
      icon: Lock,
      title: 'Authentication Ready',
      description: 'Complete auth system with JWT tokens, refresh tokens, password hashing, and secure cookies.',
    },
    {
      icon: Zap,
      title: 'Testing Setup',
      description: 'Unit tests with Vitest, e2e tests with Playwright, and MSW for API mocking.',
    },
    {
      icon: Boxes,
      title: 'Monorepo Architecture',
      description: 'Organized with npm workspaces and Turborepo for efficient builds and development.',
    },
    {
      icon: CheckCircle2,
      title: 'Production Ready',
      description: 'Docker setup, error handling, logging, security headers, and deployment configurations included.',
    },
    {
      icon: Rocket,
      title: 'Developer Experience',
      description: 'Hot reload, TypeScript strict mode, ESLint, Prettier, and comprehensive documentation.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-6 leading-tight tracking-tight">
              Fullstack Starter.{' '}
              <span className="relative inline-block">
                <span className="relative z-10">Everything set up for you.</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-black/10 -rotate-1"></span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light mb-12">
              Modern fullstack starter with backend & frontend ready to go. Skip the boilerplate and start building.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-black text-center mb-12">
              Everything you need to build great apps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative"
                >
                  <div className="h-full bg-white border border-gray-200 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:border-black/20 hover:-translate-y-1">
                    <div className="flex flex-col h-full">
                      <div className="w-12 h-12 bg-black/5 rounded-lg flex items-center justify-center mb-4 group-hover:bg-black/10 transition-colors">
                        <feature.icon className="w-6 h-6 text-black" />
                      </div>
                      <h3 className="text-lg font-semibold text-black mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <div className="inline-block bg-gray-50 border border-gray-200 rounded-2xl p-8 sm:p-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-black mb-4">Ready to start building?</h3>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                Clone the repository and have a production-ready app running in minutes.
              </p>
              <a
                href="https://github.com/cieslarmichal/fullstack-starter"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-black/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
