import { useState, useRef, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Leaf, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import heroVideo from '@/assets/hero.mp4';

export default function AuthLayout() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      setVideoLoaded(true);
    }
  }, []);

  return (
    <div className="dark min-h-screen w-screen flex flex-col justify-between relative overflow-hidden bg-[#06140F] font-sans transition-colors duration-500 text-slate-300">
      
      <style>{`
        .grain {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* FULL PAGE BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <video
          ref={videoRef}
          src={heroVideo}
          preload="auto"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onCanPlay={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out ${
            videoLoaded ? 'opacity-35' : 'opacity-0'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06140F]/65 via-[#06140F]/45 to-[#06140F]/80 z-10" />
        <div className="absolute inset-0 grain z-20 opacity-20" />
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[#7FBF8C]/[0.08] blur-[120px] z-20" />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-[#E8C468]/[0.06] blur-[100px] z-20" />
      </div>

      {/* ── Top Header Brand ───────────────────────────────── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-900/50 backdrop-blur-md border border-emerald-700/50 shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform duration-300">
            <Leaf className="h-5.5 w-5.5 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xl font-black text-white leading-none tracking-tight">CarbonTrack</span>
            <p className="text-[9px] uppercase tracking-widest font-bold text-emerald-300/70 mt-0.5">Sustainability Platform</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-emerald-400" />
          <select
            value={i18n.resolvedLanguage || i18n.language || 'en'}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs font-semibold text-emerald-200 outline-none backdrop-blur-md transition hover:border-white/20 focus:border-emerald-500"
            aria-label="Select language"
          >
            <option value="en" className="bg-slate-900 text-white">English</option>
            <option value="ta" className="bg-slate-900 text-white">தமிழ்</option>
            <option value="hi" className="bg-slate-900 text-white">हिंदी</option>
            <option value="es" className="bg-slate-900 text-white">Español</option>
            <option value="fr" className="bg-slate-900 text-white">Français</option>
            <option value="de" className="bg-slate-900 text-white">Deutsch</option>
            <option value="ar" className="bg-slate-900 text-white">العربية</option>
            <option value="zh" className="bg-slate-900 text-white">中文</option>
            <option value="ja" className="bg-slate-900 text-white">日本語</option>
          </select>
        </div>
      </header>

      {/* ── Center Content ─────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[980px]">
          <Outlet />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-400/60 font-medium">
        <span>© {new Date().getFullYear()} CarbonTrack. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link to="#" className="hover:text-emerald-300 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="#" className="hover:text-emerald-300 transition-colors">Terms of Service</Link>
        </div>
      </footer>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '1.25rem',
            fontSize: '0.875rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          },
        }}
      />
    </div>
  );
}
