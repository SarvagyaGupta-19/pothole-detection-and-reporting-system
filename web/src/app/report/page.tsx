"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, AlertTriangle, MapPin, Loader2, CheckCircle2, ShieldCheck, Mail, Navigation, Activity, Plus, X } from "lucide-react";
import exifr from "exifr";
import dynamic from 'next/dynamic';
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-100 flex flex-col items-center justify-center border border-gray-200 animate-pulse">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <div className="text-gray-500 font-medium tracking-wide">Loading Global Civic Network...</div>
    </div>
  )
});

interface MLResult {
  pothole_count: number;
  detections: { severity: string; confidence: number }[];
}

interface SubmissionResult {
  isDuplicate: boolean;
  message: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  
  const [hasLocation, setHasLocation] = useState(false);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [nearbyCount, setNearbyCount] = useState(0);


  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);


  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mlResult, setMlResult] = useState<MLResult | null>(null);
  const [reportCoords, setReportCoords] = useState<{lat: number, lng: number} | null>(null);
  const [exifWarning, setExifWarning] = useState<string | null>(null);
  const [isReadyToReview, setIsReadyToReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  
  const [senderEmail, setSenderEmail] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user?.email && !senderEmail) {
      setSenderEmail(session.user.email);
    }
  }, [session, senderEmail]);

  useEffect(() => {
    fetchReports();
    // Auto-fetch location if already granted
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        }
      });
    }
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.success) {
        setAllReports(data.data);
        if (userCoords) {
          calculateNearby(userCoords.lat, userCoords.lng, data.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const calculateNearby = (lat: number, lng: number, reports: any[]) => {
    let count = 0;
    reports.forEach(r => {
      const R = 6371; 
      const dLat = (r.latitude - lat) * Math.PI / 180;
      const dLon = (r.longitude - lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(r.latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      if (distance <= 5) count++; 
    });
    setNearbyCount(count);
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHasLocation(true);
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserCoords(coords);
          calculateNearby(coords.lat, coords.lng, allReports);
        },
        (error) => {
          setIsLocationModalOpen(true);
        }
      );
    } else {
      setIsLocationModalOpen(true);
    }
  };

  const handleManualLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAddress) return;
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualAddress)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setHasLocation(true);
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setUserCoords(coords);
        calculateNearby(coords.lat, coords.lng, allReports);
        setIsLocationModalOpen(false);
      } else {
        toast.error("Could not find that address. Please try again with a more specific location.");
      }
    } catch (e) {
      toast.error("Error finding address. Please try again.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleFABClick = () => {
    if (status !== "authenticated") {
      signIn();
      return;
    }
    setIsUploadPanelOpen(true);
    if (!hasLocation) {
      requestLocation();
    }
  };

  const closeUploadPanel = () => {
    setIsUploadPanelOpen(false);
    setFile(null);
    setPreviewUrl(null);
    setMlResult(null);
    setSubmissionResult(null);
    setIsReadyToReview(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      setMlResult(null);
      setSubmissionResult(null);
      setExifWarning(null);
      setReportCoords(null);
      setIsReadyToReview(false);
    }
  };

  const handleAnalyzeAndLocate = async () => {
    if (!file || !userCoords) return;
    setIsAnalyzing(true);
    setExifWarning(null);

    try {
      const exifData = await exifr.gps(file).catch(() => null);
      let exifLat: number | null = null;
      let exifLng: number | null = null;
      
      if (exifData && exifData.latitude && exifData.longitude) {
        exifLat = exifData.latitude;
        exifLng = exifData.longitude;
      }

      if (exifLat && exifLng) {
        const latDiff = Math.abs(userCoords.lat - exifLat);
        const lngDiff = Math.abs(userCoords.lng - exifLng);
        
        if (latDiff > 0.01 || lngDiff > 0.01) {
          setExifWarning("Warning: The image GPS location differs significantly from your current location.");
        }
        setReportCoords({ lat: exifLat, lng: exifLng });
      } else {
        setExifWarning("Warning: No GPS metadata found in image. Using your live location.");
        setReportCoords(userCoords);
      }

      const formData = new FormData();
      formData.append("file", file);
      const mlApiUrl = process.env.NEXT_PUBLIC_ML_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${mlApiUrl}/detect`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setMlResult(data);
      setIsReadyToReview(true);
    } catch (error) {
      console.error("Analysis Pipeline Error:", error);
      toast.error("Failed to reach ML detection service. Make sure api.py is running!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmAndSend = async () => {
    if (!mlResult || mlResult.pothole_count === 0 || !reportCoords || !file || !session?.user?.email) return;
    
    setIsSubmitting(true);
    try {

      const uploadData = new FormData();
      uploadData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) throw new Error("Failed to save image to disk");
      const fileUrl = uploadJson.url;


      const payload = {
        latitude: reportCoords.lat,
        longitude: reportCoords.lng,
        imageUrl: fileUrl, 
        severity: mlResult.detections[0].severity,
        confidence: mlResult.detections[0].confidence,
        senderEmail: senderEmail || session?.user?.email,
        targetEmail: targetEmail
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      setSubmissionResult(data);
      if (data.success) {
        toast.success("Report submitted successfully!");
        fetchReports();
      } else {
        toast.error("Failed to save report.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit report and send email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-100 flex flex-col">
      
      {/* Background Map */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <Map reports={allReports} userLocation={userCoords || undefined} className="w-full h-full" />
      </div>
      

      {/* Floating Action Button (FAB) */}
      {!isUploadPanelOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button 
            onClick={handleFABClick}
            className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-gray-900/40 transition-all hover:scale-105 flex items-center gap-2 border border-gray-800"
          >
            <Plus className="w-6 h-6" /> Report Pothole
          </button>
        </div>
      )}

      {/* Slide-up Upload Panel */}
      {isUploadPanelOpen && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={closeUploadPanel}></div>
          
          <div className="bg-white/95 backdrop-blur-2xl w-full sm:w-[500px] sm:rounded-[2rem] rounded-t-[2rem] p-6 sm:p-8 shadow-2xl border border-white/50 pointer-events-auto relative z-40 animate-in slide-in-from-bottom-full duration-300">
            
            <button onClick={closeUploadPanel} className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              New Report
            </h2>
            
            {!hasLocation ? (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center border border-blue-100">
                  <Navigation className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Enable Location</h3>
                  <p className="text-gray-500 mt-2 font-medium">We need your location to map nearby hazards and accurately verify your reports.</p>
                </div>
                <button 
                  onClick={requestLocation}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                >
                  Allow Location Access
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                
                {!file && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/50 rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden bg-white/50"
                  >
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-indigo-600 mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tap to upload photo</h3>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Original camera photos preferred</p>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*" />
                  </div>
                )}

                {file && previewUrl && !isReadyToReview && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">Photo Ready</h4>
                        <p className="text-xs text-gray-500 font-medium">AI will analyze severity and EXIF.</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleAnalyzeAndLocate}
                      disabled={isAnalyzing}
                      className="w-full py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg shadow-blue-500/30"
                    >
                      {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Scanning Image...</> : <><ShieldCheck className="w-5 h-5" /> Analyze Image</>}
                    </button>
                  </div>
                )}

                {isReadyToReview && mlResult && !submissionResult && (
                  <div className="space-y-5 animate-in slide-in-from-right-8">
                    {/* Image Preview with Bounding Boxes */}
                    <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl!} alt="Pothole Detection" className="w-full h-auto object-contain max-h-[250px]" />
                      
                      {mlResult.detections.map((det, idx) => {
                        const { x1, y1, width, height } = det.bounding_box;
                        const imgW = mlResult.image_size.width;
                        const imgH = mlResult.image_size.height;
                        
                        return (
                          <div 
                            key={idx}
                            className="absolute border-[3px] border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                            style={{
                              left: `${(x1 / imgW) * 100}%`,
                              top: `${(y1 / imgH) * 100}%`,
                              width: `${(width / imgW) * 100}%`,
                              height: `${(height / imgH) * 100}%`,
                            }}
                          >
                            <span className="absolute -top-6 left-[-3px] bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 whitespace-nowrap">
                              {det.severity} ({(det.confidence * 100).toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {exifWarning && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-medium mt-2">
                        {exifWarning}
                      </div>
                    )}

                    {mlResult.pothole_count > 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                          <span className="text-gray-500 font-medium text-sm">Detected Severity</span>
                          <span className="font-extrabold uppercase text-sm px-2 py-1 bg-red-100 text-red-700 rounded-lg">{mlResult.detections[0].severity}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium text-sm">Location Match</span>
                          <span className="text-emerald-600 font-bold text-sm flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Verified
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl font-medium border border-emerald-200">
                        No damage detected. Report not required.
                      </div>
                    )}

                    {mlResult.pothole_count > 0 && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">From Email (Your Email)</label>
                          <input 
                            type="email" 
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="you@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">To Email (Target Authority)</label>
                          <input 
                            type="email" 
                            value={targetEmail}
                            onChange={(e) => setTargetEmail(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="sarvagya653@gmail.com"
                          />
                          <p className="text-[10px] text-green-600 mt-1 font-medium px-1">
                            Powered by Gmail SMTP. You can send this report to any valid email address.
                          </p>
                        </div>
                      </div>
                    )}

                    {mlResult.pothole_count > 0 && (
                      <button 
                        onClick={handleConfirmAndSend}
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-2xl font-bold text-white bg-gray-900 hover:bg-black flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-lg"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-5 h-5" /> Submit & Email Authority</>}
                      </button>
                    )}
                  </div>
                )}

                {submissionResult && (
                  <div className="text-center space-y-4 py-6 animate-in zoom-in-95">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-inner border border-emerald-200">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Success!</h3>
                    <p className="text-gray-500 font-medium">The authority has been emailed. It is now live on the global map.</p>
                    <button onClick={closeUploadPanel} className="w-full py-4 mt-4 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200">
                      Return to Map
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Location Fallback Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Location Required</h3>
              <p className="text-gray-500 font-medium">We couldn&apos;t access your GPS. Please enter an address or intersection manually so we can plot your hazard report.</p>
            </div>
            
            <form onSubmit={handleManualLocation} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. 123 Main St, New York"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                disabled={isGeocoding}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-gray-900"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="flex-1 py-3 px-4 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeocoding || !manualAddress}
                  className="flex-1 py-3 px-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isGeocoding ? "Searching..." : "Set Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
