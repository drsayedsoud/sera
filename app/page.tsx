"use client";

import { useState, useRef, useEffect } from "react";
import Head from "next/head";

const DURATION = 15000; // 15 seconds

const scriptText = [
  { time: 0, text: "🎙️ الراوي: في عام الفيل، استقبلت مكة المرضعات من بادية بني سعد..." },
  { time: 3000, text: "🎙️ أخذت حليمة السعدية الرضيع اليتيم 'محمداً' ﷺ بعد أن زهد فيه الآخرون." },
  { time: 6000, text: "🎙️ تحركت القافلة.. وبمجرد أن أركبته حليمة، نشطت ناقتها الضعيفة وسبقت الجميع!" },
  { time: 10000, text: "🎙️ تعجب ركب بني سعد من سرعة الناقة ببركة هذا الرضيع المبارك." },
  { time: 14000, text: "🎙️ حلت البركة العظيمة في ديار بني سعد بمقدم النبي ﷺ." }
];

export default function Home() {
  const [commentary, setCommentary] = useState("اضغط على 'ابدأ المشهد' لمشاهدة الموقف...");
  const [isAnimating, setIsAnimating] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  
  const pathRef = useRef<SVGPathElement>(null);
  const caravanRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number>();
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Initial position
    if (pathRef.current && caravanRef.current && !isAnimating) {
      const startPoint = pathRef.current.getPointAtLength(0);
      caravanRef.current.setAttribute("transform", `translate(${startPoint.x}, ${startPoint.y})`);
    }
  }, [isAnimating]);

  const animate = (startTime: number, currentTime: number) => {
    const elapsed = currentTime - startTime;
    let progress = elapsed / DURATION;
    
    if (progress > 1) progress = 1;
    
    if (pathRef.current && caravanRef.current) {
      const pathLength = pathRef.current.getTotalLength();
      const point = pathRef.current.getPointAtLength(progress * pathLength);
      caravanRef.current.setAttribute("transform", `translate(${point.x}, ${point.y})`);
    }
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame((time) => animate(startTime, time));
    } else {
      setIsAnimating(false);
    }
  };

  const startJourney = () => {
    if (isAnimating) return;
    resetJourney();
    
    setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
      
      animationRef.current = requestAnimationFrame((time) => animate(time, time));
      
      scriptText.forEach(scene => {
        const t1 = setTimeout(() => {
          setOpacity(0);
          const t2 = setTimeout(() => {
            setCommentary(scene.text);
            setOpacity(1);
          }, 300);
          timeoutsRef.current.push(t2);
        }, scene.time);
        timeoutsRef.current.push(t1);
      });
    }, 100);
  };

  const resetJourney = () => {
    setIsAnimating(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    
    setIsVisible(false);
    if (pathRef.current && caravanRef.current) {
      const startPoint = pathRef.current.getPointAtLength(0);
      caravanRef.current.setAttribute("transform", `translate(${startPoint.x}, ${startPoint.y})`);
    }
    
    setOpacity(1);
    setCommentary("اضغط على 'ابدأ المشهد' لمشاهدة الموقف...");
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-5 font-sans flex flex-col items-center justify-center" dir="rtl">
      <Head>
        <title>السيرة النبوية التفاعلية</title>
      </Head>

      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 md:p-8 shadow-2xl max-w-4xl w-full">
        <div className="mb-6 text-center">
          <h1 className="text-amber-400 font-bold text-2xl md:text-3xl mb-4">رحلة النور إلى بني سعد</h1>
          <div 
            className="text-white font-semibold text-lg md:text-xl min-h-[80px] bg-neutral-900 p-4 rounded-lg border border-neutral-700 flex items-center justify-center transition-opacity duration-300"
            style={{ opacity: opacity }}
          >
            {commentary}
          </div>
        </div>

        {/* Map Container */}
        <div className="relative w-full aspect-video rounded-lg border-2 border-amber-600/50 overflow-hidden shadow-inner bg-black">
          {/* We use a standard img tag here; in a real app you might use next/image */}
          <img src="/seerah_map.jpg" alt="خريطة السيرة" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/20"></div>
          
          <svg className="relative w-full h-full drop-shadow-md" viewBox="0 0 800 450">
            {/* Route Path */}
            <path 
              id="routePath"
              ref={pathRef}
              d="M 250 280 C 350 350, 500 350, 650 150" 
              fill="none" 
              stroke="#fde047" 
              strokeWidth="4" 
              strokeDasharray="8 8" 
              opacity="0.6"
            />
            
            {/* Caravan Group */}
            <g ref={caravanRef} style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
              {/* Glowing Light (Prophet PBUH) */}
              <circle cx="0" cy="-10" r="30" fill="#fde047" opacity="0.8">
                <animate attributeName="r" values="30;45;30" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="-10" r="12" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 8px white)' }} />
              
              <text x="0" y="5" fontSize="35" textAnchor="middle" dominantBaseline="middle">🐪</text>
            </g>
          </svg>
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={startJourney} 
            className="px-8 py-3 bg-amber-600 text-white rounded-md font-bold text-lg shadow-lg hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            ▶️ ابدأ المشهد
          </button>
          <button 
            onClick={resetJourney} 
            className="px-8 py-3 border-2 border-neutral-600 text-neutral-300 rounded-md font-bold text-lg shadow-sm hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 cursor-pointer"
          >
            🔄 إعادة
          </button>
        </div>
      </div>
    </div>
  );
}
