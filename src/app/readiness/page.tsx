import Link from "next/link";

const tracks = [
  {
    id: "grant",
    title: "Grant Readiness",
    description: "Check your grant application readiness",
  },
  {
    id: "scholarship",
    title: "Scholarship Readiness",
    description: "Check your scholarship application readiness",
  },
  {
    id: "research",
    title: "Research Readiness",
    description: "Check your research proposal readiness",
  },
];

export default function ReadinessPage() {
  return (
    <div className="p-3 md:p-5">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Funding Readiness Check</h1>
      <p className="text-sm text-slate-600">See how funders view your application.</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <Link
            key={track.id}
            href={`/readiness/${track.id}`}
            className="block p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
          >
            <h3 className="font-semibold text-slate-900">{track.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{track.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
