export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100">
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Fullstack Starter.{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Everything set up for you.
              </span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
