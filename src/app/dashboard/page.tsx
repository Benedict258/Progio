export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
      <p className="text-slate-600">
        Welcome to Progio — your AI-powered research and funding workspace.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900">Grants</h3>
          <p className="text-sm text-slate-500 mt-1">12 new opportunities</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900">Scholarships</h3>
          <p className="text-sm text-slate-500 mt-1">8 new opportunities</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-900">Research</h3>
          <p className="text-sm text-slate-500 mt-1">3 active projects</p>
        </div>
      </div>
    </div>
  );
}
