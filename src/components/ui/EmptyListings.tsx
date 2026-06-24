"use client";

import { useRouter, usePathname } from "next/navigation";
import { LuRefreshCw, LuHouse, LuCompass } from "react-icons/lu";

interface EmptyListingsProps {
  title: string;
  subtitle: string;
  filter?: boolean;
}

export default function EmptyListings({ title, subtitle, filter }: EmptyListingsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClearFilters = () => {
    router.push(pathname);
  };

  const handlePresetClick = (type: string, value: string) => {
    const params = new URLSearchParams();
    params.set(type, value);
    router.push(`/listings?${params.toString()}`);
  };

  const suggestedPresets = [
    { label: "Bedsitters", type: "unitType", value: "Bedsitter" },
    { label: "Single Rooms", type: "unitType", value: "Single Room" },
    { label: "Studios", type: "unitType", value: "Studio" },
    { label: "Apartments", type: "category", value: "apartment" },
    { label: "Houses", type: "category", value: "house" },
    { label: "Villas", type: "category", value: "villa" },
  ];

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center pt-8 pb-16 px-4 md:pt-12 md:pb-24 md:px-8 text-center select-none bg-[#f9fbfc]">
      {/* Self-contained CSS keyframe animations */}
      <style>{`
        @keyframes smokeRise {
          0% {
            stroke-dashoffset: 0;
            opacity: 0;
            transform: translateY(0) scale(1);
          }
          30% {
            opacity: 0.6;
          }
          100% {
            stroke-dashoffset: -30;
            opacity: 0;
            transform: translateY(-24px) scale(1.6);
          }
        }
        @keyframes floatGentle {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(15px);
          }
        }
        @keyframes pulseSoft {
          0%, 100% {
            opacity: 0.7;
            filter: drop-shadow(0 0 1px rgba(254, 240, 138, 0.4));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(254, 240, 138, 0.9));
          }
        }
        .animate-smoke {
          animation: smokeRise 4s infinite linear;
        }
        .animate-float-1 {
          animation: floatGentle 9s infinite ease-in-out;
        }
        .animate-float-2 {
          animation: floatGentle 14s infinite ease-in-out 1.5s;
        }
        .animate-pulse-soft {
          animation: pulseSoft 2.5s infinite ease-in-out;
        }
      `}</style>

      {/* Elite Minimalist SVG Illustration */}
      <div className="w-full max-w-sm mx-auto mb-4 flex justify-center items-center">
        <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <defs>
            {/* Soft Warm Radial Background Gradient */}
            <radialGradient id="backdrop-grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#FFF1F2" stopOpacity="1" />
              <stop offset="50%" stopColor="#FFF8F8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f9fbfc" stopOpacity="0" />
            </radialGradient>
            
            {/* Elegant Floating Hill Gradient */}
            <linearGradient id="hill-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            
            {/* Pine Tree Color Gradient */}
            <linearGradient id="tree-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="glow-light" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Backdrop Glow Circle */}
          <circle cx="200" cy="110" r="110" fill="url(#backdrop-grad)" />

          {/* Slow Twinkling Stars */}
          <g opacity="0.7">
            <circle cx="90" cy="50" r="1.5" fill="#FDA4AF" className="animate-pulse" />
            <circle cx="310" cy="70" r="2" fill="#FDA4AF" className="animate-pulse [animation-delay:0.8s]" />
            <circle cx="150" cy="30" r="1" fill="#FDA4AF" className="animate-pulse [animation-delay:1.6s]" />
            <circle cx="270" cy="40" r="1.5" fill="#FDA4AF" className="animate-pulse [animation-delay:0.4s]" />
          </g>

          {/* Soft floating background clouds */}
          <g opacity="0.45" fill="#E2E8F0">
            <path d="M 80,60 Q 88,48 100,52 Q 112,46 120,54 Q 128,52 128,60 Z" className="animate-float-1" />
            <path d="M 280,45 Q 288,35 298,39 Q 308,34 315,41 Q 323,39 323,46 Z" className="animate-float-2" />
          </g>

          {/* Floating Base Island / Gentle Hill */}
          <path d="M 70,185 Q 200,140 330,185 Q 290,215 110,215 Z" fill="url(#hill-grad)" />
          <path d="M 110,183 Q 200,152 290,183 Q 260,200 140,200 Z" fill="#94A3B8" opacity="0.25" />

          {/* Custom A-frame minimalist cabin */}
          <g transform="translate(180, 110)">
            {/* Ground shadow beneath the cabin */}
            <ellipse cx="20" cy="50" rx="26" ry="3.5" fill="#475569" opacity="0.15" />

            {/* Cabin Walls */}
            <path d="M 5,22 L 35,22 L 35,50 L 5,50 Z" fill="#334155" />
            {/* Sleek horizontal siding boards */}
            <line x1="5" y1="29" x2="35" y2="29" stroke="#1E293B" strokeWidth="1" />
            <line x1="5" y1="36" x2="35" y2="36" stroke="#1E293B" strokeWidth="1" />
            <line x1="5" y1="43" x2="35" y2="43" stroke="#1E293B" strokeWidth="1" />

            {/* Main Cabin Door */}
            <rect x="21" y="32" width="10" height="18" rx="1.5" fill="#1E293B" />
            {/* Brass door handle */}
            <circle cx="28.5" cy="41" r="0.75" fill="#FCD34D" />

            {/* Cozy Glowing Window (Tailwind Keyframe Animation class applied) */}
            <rect x="8" y="28" width="9" height="11" rx="1" fill="#FEF08A" filter="url(#glow-light)" className="animate-pulse-soft" />
            {/* Elegant Window Panes */}
            <line x1="12.5" y1="28" x2="12.5" y2="39" stroke="#78350F" strokeWidth="0.5" opacity="0.4" />
            <line x1="8" y1="33.5" x2="17" y2="33.5" stroke="#78350F" strokeWidth="0.5" opacity="0.4" />

            {/* Striking pitched roof in brand's primary crimson (#256ff1) */}
            <path d="M 0,24 L 20,0 L 40,24 Z" fill="#256ff1" />
            <path d="M -2,24 L 20,-2 L 42,24 Z" stroke="#256ff1" strokeWidth="2.5" strokeLinecap="round" />

            {/* Sleek chimney */}
            <rect x="27" y="1" width="4.5" height="11" fill="#1E293B" />
            <rect x="25.5" y="0" width="7.5" height="2" fill="#334155" />
            
            {/* Cozy smoke rising from chimney */}
            <path d="M 29,-3 C 32,-11 26,-19 32,-27 Q 35,-33 29,-38" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3,3" fill="none" strokeLinecap="round" className="animate-smoke" />
          </g>

          {/* Minimalist pine trees surrounding the cabin */}
          {/* Left Forest Pine */}
          <g transform="translate(130, 115) scale(0.9)">
            <rect x="18" y="50" width="4" height="14" fill="#475569" />
            <path d="M 20,10 L 4,31 L 36,31 Z" fill="url(#tree-grad)" />
            <path d="M 20,20 L 7,42 L 33,42 Z" fill="url(#tree-grad)" />
            <path d="M 20,30 L 10,52 L 30,52 Z" fill="url(#tree-grad)" />
          </g>

          {/* Right rounded forest tree */}
          <g transform="translate(242, 130)">
            <rect x="8" y="18" width="4.5" height="16" fill="#475569" />
            <circle cx="10" cy="11" r="16" fill="#1E293B" />
            <circle cx="15.5" cy="5" r="9.5" fill="#334155" opacity="0.8" />
          </g>
        </svg>
      </div>

      {/* Elite Nudge-style Typography Heading */}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-gray-950 text-balance mb-4 leading-tight">
        {title === "No properties found" ? "No properties found, alas!" : title}
      </h2>
      
      {/* Subtitle description */}
      <p className="text-base md:text-lg text-gray-600 max-w-md mx-auto leading-relaxed text-balance mb-8 font-normal">
        {subtitle}
      </p>

      {/* Action Buttons Block */}
      <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center w-full max-w-xs sm:max-w-none mx-auto mb-12">
        {filter ? (
          <>
            <button
              onClick={handleClearFilters}
              className="cursor-pointer font-semibold leading-none w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white rounded-full hover:bg-[#256ff1] active:scale-95 transition-all duration-200 shadow-md hover:shadow-sm text-sm md:text-base"
            >
              <LuRefreshCw size={16} className="animate-[spin_4s_linear_infinite]" />
              <span>Clear all filters</span>
            </button>
            <button
              onClick={() => router.push("/")}
              className="cursor-pointer font-semibold leading-none w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-900 rounded-full hover:bg-gray-200 active:scale-95 transition-all duration-200 text-sm md:text-base"
            >
              <LuHouse size={16} />
              <span>Go to homepage</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/listings")}
            className="cursor-pointer font-semibold leading-none w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-black text-white rounded-full hover:bg-[#256ff1] active:scale-95 transition-all duration-200 shadow-md hover:shadow-sm text-sm md:text-base"
          >
            <LuCompass size={18} className="animate-pulse" />
            <span>Explore properties</span>
          </button>
        )}
      </div>

      {/* Discovery preset suggestion tags section */}
      {filter && (
        <div className="mt-2 w-full max-w-md mx-auto pt-6 border-t border-gray-100">
          <p className="text-xs md:text-sm text-gray-500 font-medium uppercase tracking-wider mb-4">
            You might be looking for:
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {suggestedPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.type, preset.value)}
                className="cursor-pointer px-4 py-2 bg-white hover:bg-gray-50 hover:text-[#256ff1] text-gray-700 text-xs md:text-sm font-semibold rounded-full border border-gray-200 hover:border-[#256ff1]/30 transition-all active:scale-95 duration-200 shadow-xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
