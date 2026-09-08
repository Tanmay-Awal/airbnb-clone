import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/40 text-airbnb-red rounded-full flex items-center justify-center mb-6 shadow-sm">
        <span className="text-4xl font-extrabold">404</span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-md mb-8 leading-relaxed">
        The page you are looking for doesn't exist or you don't have permission to access it.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#222222] dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl hover:bg-black dark:hover:bg-gray-200 transition-all shadow-md active:scale-95 cursor-pointer"
      >
        Return to Home
      </Link>
    </div>
  );
}
