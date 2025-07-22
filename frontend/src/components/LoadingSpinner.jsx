export default function LoadingSpinner({ message }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#45323f] to-[#4a3234] w-full">
      <span className="relative flex h-12 w-12 mb-4">
        <span className="animate-spin absolute inline-flex h-full w-full rounded-full border-4 border-t-[#ffc8fe] border-b-[#ffc8fe] border-l-transparent border-r-transparent"></span>
        <span className="absolute inline-flex h-full w-full rounded-full opacity-30 border-4 border-[#ffc8fe]"></span>
      </span>
      <div className="text-[#ffc8fe] text-lg font-semibold">{message}</div>
    </div>
  );
} 