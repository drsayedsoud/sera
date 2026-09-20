"use client";

import { useState, useRef, useEffect } from "react";

const DURATION = 15000; // 15 seconds

const scriptText = [
  { time: 0, text: "🎙️ الراوي: في عام الفيل، استقبلت مكة المرضعات من بادية بني سعد..." },
  { time: 3000, text: "🎙️ أخذت حليمة السعدية الرضيع اليتيم 'محمداً' ﷺ بعد أن زهد فيه الآخرون." },
  { time: 6000, text: "🎙️ تحركت القافلة.. وبمجرد أن أركبته حليمة على أتانها، نشطت الأتان الضعيفة وسبقت الجميع!" },
  { time: 10000, text: "🎙️ تعجب ركب بني سعد من سرعة الأتان ببركة هذا الرضيع المبارك." },
  { time: 14000, text: "🎙️ حلت البركة العظيمة في ديار بني سعد بمقدم النبي ﷺ." }
];

export default function Home() {
  const [commentary, setCommentary] = useState("اضغط على 'ابدأ المشهد' لمشاهدة الموقف...");
  const [isAnimating, setIsAnimating] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [zoomStage, setZoomStage] = useState(0);
  const [infoPopup, setInfoPopup] = useState<{show: boolean, title: string, text: string, x: number, y: number}>({show: false, title: "", text: "", x: 0, y: 0});
  
  const pathRef = useRef<SVGPathElement>(null);
  const caravanRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number>(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Cinematic Intro: zoom from wide to detail
    setTimeout(() => setZoomStage(1), 500);
    setTimeout(() => setZoomStage(2), 3500);

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
    setInfoPopup({ ...infoPopup, show: false });
    
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

  const showInfo = (e: React.MouseEvent, title: string, text: string) => {
    e.stopPropagation();
    const rect = (e.target as Element).getBoundingClientRect();
    // simple offset positioning
    setInfoPopup({
      show: true,
      title,
      text,
      x: e.clientX,
      y: e.clientY - 100
    });
  };

  return (
    <div 
      className="min-h-screen bg-neutral-900 text-white p-5 font-sans flex flex-col items-center justify-center overflow-hidden" 
      onClick={() => setInfoPopup({...infoPopup, show: false})}
    >

      <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 md:p-8 shadow-2xl w-full max-w-6xl z-10 relative">
        
        <div className="mb-6 text-center">
          <h1 className="text-amber-400 font-bold text-2xl md:text-4xl mb-4">رحلة النور إلى ديار بني سعد</h1>
          <div 
            className="text-white font-semibold text-lg md:text-xl min-h-[80px] bg-neutral-900 p-4 rounded-lg border border-neutral-700 flex items-center justify-center transition-opacity duration-300 shadow-inner"
            style={{ opacity: opacity }}
          >
            {commentary}
          </div>
        </div>

        {/* Map Container */}
        <div 
          className="relative w-full aspect-video rounded-lg border-2 border-amber-600/50 overflow-hidden shadow-[0_0_40px_rgba(217,119,6,0.3)] bg-black transition-transform origin-center"
          style={{
            transform: zoomStage === 0 ? 'scale(0.3) translateY(20%)' : 'scale(1) translateY(0)',
            transition: 'transform 3s cubic-bezier(0.25, 1, 0.5, 1)',
            opacity: zoomStage === 0 ? 0.3 : 1
          }}
        >
          <img src="/seerah_map.jpg" alt="خريطة السيرة" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/30"></div>
          
          <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
            
            {/* Interactive Points */}
            <g 
              transform="translate(180, 280)" 
              className="cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={(e) => showInfo(e, "مكة المكرمة", "البلد الحرام، حيث ولد النبي ﷺ وتلقفته مرضعات بني سعد.")}
            >
              <circle cx="0" cy="0" r="40" fill="transparent" />
            </g>
            
            <g 
              transform="translate(620, 100)" 
              className="cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={(e) => showInfo(e, "ديار بني سعد (الطائف)", "منازل قبيلة بني سعد بن بكر، المشهورة بالفصاحة والهواء النقي.")}
            >
              <circle cx="0" cy="0" r="40" fill="transparent" />
            </g>

            {/* Route Path */}
            <path 
              id="routePath"
              ref={pathRef}
              d="M 220 280 C 350 350, 500 350, 650 150" 
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
              
              {/* Donkey icon instead of camel */}
              <text x="0" y="5" fontSize="40" textAnchor="middle" dominantBaseline="middle">🫏</text>
            </g>
          </svg>
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); startJourney(); }} 
            className="px-8 py-3 bg-amber-600 text-white rounded-md font-bold text-lg shadow-lg hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            ▶️ ابدأ المشهد
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); resetJourney(); }} 
            className="px-8 py-3 border-2 border-neutral-600 text-neutral-300 rounded-md font-bold text-lg shadow-sm hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 cursor-pointer"
          >
            🔄 إعادة
          </button>
        </div>
      </div>

      {/* Info Popup */}
      {infoPopup.show && (
        <div 
          className="fixed z-50 bg-neutral-800 border border-amber-500 rounded-lg p-4 shadow-2xl max-w-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: infoPopup.x, top: infoPopup.y }}
        >
          <h3 className="text-amber-400 font-bold text-xl mb-2">{infoPopup.title}</h3>
          <p className="text-white text-sm leading-relaxed">{infoPopup.text}</p>
        </div>
      )}

      {/* Intro Overlay Background Map simulation */}
      <div 
        className="fixed inset-0 pointer-events-none transition-opacity duration-1000 z-0 bg-[#cfa568]"
        style={{ opacity: zoomStage === 2 ? 0 : 0.5 }}
      ></div>

    </div>
  );
}
