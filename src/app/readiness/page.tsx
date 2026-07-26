export default function ReadinessPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Readiness Assessments</h1>
      <p className="text-slate-600">Evaluate your readiness for grants, scholarships, and research.</p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900">Grant Readiness</h3>
          <p className="text-sm text-slate-500 mt-1">Check your grant application readiness</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900">Scholarship Readiness</h3>
          <p className="text-sm text-slate-500 mt-1">Check your scholarship application readiness</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900">Research Readiness</h3>
          <p className="text-sm text-slate-500 mt-1">Check your research proposal readiness</p>
        </div>
      </div>
    </div>
  );
}
