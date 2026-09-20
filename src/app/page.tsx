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
  const [hasStarted, setHasStarted] = useState(false);
  const [commentary, setCommentary] = useState("اضغط على 'ابدأ المشهد' لمشاهدة الموقف...");
  const [isAnimating, setIsAnimating] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [zoomStage, setZoomStage] = useState(0); // 0: Pre-start, 1: Zooming, 2: Arrived
  const [infoPopup, setInfoPopup] = useState<{show: boolean, title: string, text: string, x: number, y: number}>({show: false, title: "", text: "", x: 0, y: 0});
  
  const pathRef = useRef<SVGPathElement>(null);
  const caravanRef = useRef<SVGGElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Initial position for SVG path
    if (pathRef.current && caravanRef.current && !isAnimating) {
      const startPoint = pathRef.current.getPointAtLength(0);
      caravanRef.current.setAttribute("transform", `translate(${startPoint.x}, ${startPoint.y})`);
    }
  }, [isAnimating]);

  const enterExperience = () => {
    setHasStarted(true);
    
    // Play desert wind sound
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }

    // Cinematic Intro sequence
    setTimeout(() => setZoomStage(1), 100);
    setTimeout(() => {
      setZoomStage(2);
      // Fade out wind sound after zoom is done
      if (audioRef.current) {
        let vol = 0.5;
        const fadeOut = setInterval(() => {
          if (vol > 0.05) {
            vol -= 0.05;
            audioRef.current!.volume = vol;
          } else {
            audioRef.current!.pause();
            clearInterval(fadeOut);
          }
        }, 200);
      }
    }, 4000);
  };

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
    setInfoPopup({
      show: true,
      title,
      text,
      x: e.clientX,
      y: e.clientY - 100
    });
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white" dir="rtl">
        <h1 className="text-4xl md:text-6xl font-bold text-amber-400 mb-8 tracking-widest drop-shadow-lg">السيرة النبوية التفاعلية</h1>
        <p className="text-xl text-neutral-300 mb-12">رحلة النور.. الخرائط الذهنية لسيرة خير البشر ﷺ</p>
        <button 
          onClick={enterExperience}
          className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-2xl rounded-full shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all transform hover:scale-105"
        >
          ابدأ الرحلة 🧭
        </button>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-neutral-900 text-white p-5 font-sans flex flex-col items-center justify-center overflow-hidden" 
      onClick={() => setInfoPopup({...infoPopup, show: false})}
      dir="rtl"
    >
      {/* Wind Sound Effect from public domain Google actions library */}
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/weather/wind_blowing_in_the_desert.ogg" loop />

      <div 
        className="bg-neutral-800 border border-neutral-700 rounded-xl p-5 md:p-8 shadow-2xl w-full max-w-6xl z-10 relative transition-opacity duration-1000"
        style={{ opacity: zoomStage === 2 ? 1 : 0 }}
      >
        
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
            transform: zoomStage === 1 ? 'scale(1) translateY(0)' : zoomStage === 2 ? 'scale(1) translateY(0)' : 'scale(0.2) translateY(50%)',
            transition: 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)'
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

      {/* Intro Background Map simulation */}
      {zoomStage < 2 && (
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center bg-[#cfa568]">
            <p className="text-6xl font-bold text-[#8b5a2b] opacity-20">شبه الجزيرة العربية</p>
        </div>
      )}

    </div>
  );
}
