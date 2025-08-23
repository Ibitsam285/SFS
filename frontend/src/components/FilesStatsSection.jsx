export default function FilesStatsSection({ owned, accessible }) {
  return (
    <section className="bg-gray-800 p-4 rounded flex justify-between">
      <div>
        <div className="font-bold text-blue-200 text-lg pl-5">Files Owned</div>
        <div className="text-2xl text-gray-300 pl-15">{owned}</div>
      </div>
      <div>
        <div className="font-bold text-blue-200 text-lg pr-10">Files Accessible</div>
        <div className="text-2xl pl-15 text-gray-300">{accessible}</div>
      </div>
    </section>
  );
}