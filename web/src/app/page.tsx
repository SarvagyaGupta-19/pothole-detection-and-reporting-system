import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPin, Activity } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="flex-grow flex flex-col justify-center items-center text-center px-4 py-20 bg-gradient-to-b from-blue-50 to-gray-50">
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold text-sm mb-4">
            <ShieldCheck className="w-4 h-4" />
            AI-Powered Civic Network
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Fix your streets with <span className="text-blue-600">AI precision.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Report road hazards in seconds. Our computer vision model instantly analyzes the damage and automatically routes it to the correct civic authority.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link 
              href="/report" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Start Reporting <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold text-lg px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-12">
          
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Pinpoint Accuracy</h3>
            <p className="text-gray-600">Instantly tag potholes with precise GPS coordinates, ensuring repair crews know exactly where to go.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-red-100 p-4 rounded-2xl text-red-600">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">AI Severity Rating</h3>
            <p className="text-gray-600">Our machine learning model analyzes the image to determine the exact severity and scale of the hazard.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-green-100 p-4 rounded-2xl text-green-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Direct Civic Routing</h3>
            <p className="text-gray-600">Customize the target email or let our system route it directly to the municipality in charge.</p>
          </div>

        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-center text-sm border-t border-gray-800">
        <p className="font-bold text-white mb-2">Pothole Reporting System</p>
        <p>© 2026 CivicTech Open Source. All rights reserved.</p>
        <div className="mt-4 flex justify-center gap-4 text-xs">
          <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
