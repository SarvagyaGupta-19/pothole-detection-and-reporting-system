"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, AlertCircle, CheckCircle2, Navigation, Activity, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Report {
  id: string;
  status: string;
  severity: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  imageUrl: string | null;
  reportCount: number;
  createdAt: string;
  targetEmail: string | null;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      fetch(`/api/reports?personal=true`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setReports(data.data);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        toast.success("Status updated!");
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while updating");
    }
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${reportToDelete}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => prev.filter(r => r.id !== reportToDelete));
        toast.success("Report deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete report");
      }
    } catch (e) {
      toast.error("Error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setReportToDelete(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <div className="text-gray-500 font-medium animate-pulse">Syncing your personal records...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200/60 pb-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold tracking-wide uppercase">
            <Activity className="w-4 h-4" />
            Personal Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            My Impact
          </h1>
          <p className="text-lg text-gray-500 max-w-xl font-medium">
            Monitor the status of hazards you ({session?.user?.email}) have reported.
          </p>
        </div>
        
        <div className="glass px-5 py-3 rounded-2xl flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500 font-medium">Your Reports</div>
            <div className="text-2xl font-black text-gray-900">{reports.length}</div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Reports</h2>
        {reports.length === 0 ? (
        <div className="glass-card rounded-[2rem] p-16 text-center border-dashed border-2 border-gray-200/60 flex flex-col items-center justify-center space-y-4">
          <div className="bg-gray-50 text-gray-400 p-6 rounded-full">
            <Navigation className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">No reports yet</h3>
          <p className="text-gray-500 max-w-sm">
            Head over to the Report page to upload a photo of road damage and alert the authorities.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="glass-card rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
            >
              {/* Subtle top accent line based on status */}
              <div className={`absolute top-0 left-0 right-0 h-1 z-20 
                ${report.status === 'REPORTED' ? 'bg-amber-400' : 
                  report.status === 'FIXED' ? 'bg-emerald-500' : 
                  'bg-blue-500'}`}>
              </div>

              {/* Image Header */}
              <div className="h-40 w-full relative bg-gray-100 border-b border-gray-100">
                {report.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={report.imageUrl} alt="Hazard" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
                
                {/* Status Badge Over Image */}
                <div className="absolute top-3 left-3 z-10">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide shadow-sm border backdrop-blur-md
                    ${report.status === 'REPORTED' ? 'bg-amber-50/90 text-amber-700 border-amber-200/50' : 
                      report.status === 'FIXED' ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200/50' : 
                      'bg-blue-50/90 text-blue-700 border-blue-200/50'}`}>
                    {report.status === 'REPORTED' && <Clock className="w-4 h-4" />}
                    {report.status === 'FIXED' && <CheckCircle2 className="w-4 h-4" />}
                    {report.status}
                  </span>
                </div>
                
                <div className="absolute top-3 right-3 z-10">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-700 bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-sm px-2 py-1 rounded-lg">
                    {report.severity}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-sm text-gray-700 font-medium leading-relaxed">
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      {report.locationName ? (
                        <div className="font-bold text-gray-900 mb-0.5">{report.locationName.split(",").slice(0, 2).join(",")}</div>
                      ) : (
                        <div className="font-bold text-gray-900 mb-0.5">Coordinates</div>
                      )}
                      <div className="text-xs text-gray-500 font-mono">
                        {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 font-medium pb-2">
                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 mb-0.5">Sent To</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]" title={report.targetEmail || "N/A"}>
                        {report.targetEmail || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Update Status:</span>
                    <select 
                      value={report.status}
                      onChange={(e) => handleStatusChange(report.id, e.target.value)}
                      className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="REPORTED">Reported</option>
                      <option value="ACKNOWLEDGED">Acknowledged</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED" className="text-green-600 font-bold">Resolved</option>
                    </select>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button 
                      onClick={() => setReportToDelete(report.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Report
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-100/60 bg-gray-50/50 flex items-center justify-between mt-auto">
                <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
                  Submitted
                </span>
                <span className="text-sm font-bold text-gray-700">
                  {new Date(report.createdAt).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !isDeleting && setReportToDelete(null)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative z-50 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Delete Report?</h3>
              <p className="text-sm text-gray-500 font-medium">
                Are you sure you want to permanently delete this report? This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button 
                disabled={isDeleting}
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center gap-2"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
