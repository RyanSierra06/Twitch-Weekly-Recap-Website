export default function ErrorMessage({ message }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#45323f] to-[#4a3234] w-full">
      <div className="text-red-400 text-lg font-semibold p-8 bg-[#2d1e2f] rounded-xl border border-red-400 shadow-lg">{message}</div>
    </div>
  );
} 