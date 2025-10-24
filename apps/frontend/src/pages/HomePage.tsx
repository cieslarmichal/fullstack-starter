export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black mb-6 leading-tight tracking-tight">
              Fullstack Starter.{' '}
              <span className="relative inline-block">
                <span className="relative z-10">Everything set up for you.</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-black/10 -rotate-1"></span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Modern fullstack starter with backend & frontend ready to go.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
