export default function SectionBox({ title, children }) {
  return (
    <div className="bg-[#3a2b2f]/80 rounded-2xl p-6 border border-[#ffc8fe] w-full mt-8">
      <div className="text-[#ffc8fe] text-lg font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
} 