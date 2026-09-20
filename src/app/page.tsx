"use client";

import { useState, useRef, useEffect } from "react";

const DURATION = 15000; // 15 seconds

// Scene Data Structure
const SCENES = [
  {
    id: "bani-saad-journey",
    title: "رحلة النور إلى ديار بني سعد",
    mapImage: "/seerah_map.jpg",
    regionName: "شبه الجزيرة العربية - الحجاز",
    icon: "🫏", // Donkey
    scriptText: [
      { time: 0, text: "🎙️ الراوي: في عام الفيل، استقبلت مكة المرضعات من بادية بني سعد..." },
      { time: 3000, text: "🎙️ أخذت حليمة السعدية الرضيع اليتيم 'محمداً' ﷺ بعد أن زهد فيه الآخرون." },
      { time: 6000, text: "🎙️ تحركت القافلة.. وبمجرد أن أركبته حليمة على أتانها، نشطت الأتان الضعيفة وسبقت الجميع!" },
      { time: 10000, text: "🎙️ تعجب ركب بني سعد من سرعة الأتان ببركة هذا الرضيع المبارك." },
      { time: 14000, text: "🎙️ حلت البركة العظيمة في ديار بني سعد بمقدم النبي ﷺ." }
    ],
    pois: [
      { id: "mecca", name: "مكة المكرمة", desc: "البلد الحرام، حيث ولد النبي ﷺ وتلقفته مرضعات بني سعد.", x: 180, y: 280 },
      { id: "taif", name: "ديار بني سعد (الطائف)", desc: "منازل قبيلة بني سعد بن بكر، المشهورة بالفصاحة والهواء النقي.", x: 620, y: 100 }
    ],
    path: "M 220 280 C 350 350, 500 350, 650 150"
  },
  {
    id: "chest-splitting",
    title: "حادثة شق الصدر",
    mapImage: "/seerah_map.jpg", // Reusing same map for prototype
    regionName: "مضارب بني سعد",
    icon: "✨", // Light/Angel
    scriptText: [
      { time: 0, text: "🎙️ الراوي: شب رسول الله ﷺ في ديار بني سعد، وكان يخرج مع أخيه من الرضاعة لرعي البهم..." },
      { time: 4000, text: "🎙️ بينما هو يلعب مع الغلمان، أتاه جبريل عليه السلام فأخذه وصرعه." },
      { time: 8000, text: "🎙️ فشق عن قلبه، فاستخرج منه علقة، فقال: هذا حظ الشيطان منك." },
      { time: 12000, text: "🎙️ ثم غسله في طست من ذهب بماء زمزم، ثم لأمه (أعاده مكانه)." }
    ],
    pois: [
      { id: "bani-saad-camp", name: "مضارب بني سعد", desc: "حيث وقعت حادثة شق الصدر العظيمة التي كانت تهيئة روحية للنبي ﷺ.", x: 620, y: 100 }
    ],
    path: "M 620 100 C 600 80, 580 120, 620 100" // A small path around Bani Saad
  }
];

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  
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

  // Load saved progress on mount
  useEffect(() => {
    const savedIndex = localStorage.getItem('seerah_saved_scene');
    if (savedIndex !== null) {
      setCurrentSceneIndex(parseInt(savedIndex, 10));
    }
  }, []);

  const scene = SCENES[currentSceneIndex];

  // Reset states when scene changes
  useEffect(() => {
    if (hasStarted) {
      setZoomStage(0);
      resetJourney();
      playIntro();
    }
  }, [currentSceneIndex, hasStarted]);

  const playIntro = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.8;
      audioRef.current.play().catch(e => console.log("Audio blocked", e));
    }
    setTimeout(() => setZoomStage(1), 100);
    setTimeout(() => {
      setZoomStage(2);
      if (audioRef.current) {
        let vol = 0.8;
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

  const enterExperience = () => {
    setHasStarted(true);
  };

  const nextScene = () => {
    if (currentSceneIndex < SCENES.length - 1) {
      const nextIdx = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIdx);
      localStorage.setItem('seerah_saved_scene', nextIdx.toString());
    }
  };

  const prevScene = () => {
    if (currentSceneIndex > 0) {
      const prevIdx = currentSceneIndex - 1;
      setCurrentSceneIndex(prevIdx);
      localStorage.setItem('seerah_saved_scene', prevIdx.toString());
    }
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
      
      scene.scriptText.forEach(s => {
        const t1 = setTimeout(() => {
          setOpacity(0);
          const t2 = setTimeout(() => {
            setCommentary(s.text);
            setOpacity(1);
          }, 300);
          timeoutsRef.current.push(t2);
        }, s.time);
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
        <h1 className="text-4xl md:text-6xl font-bold text-amber-400 mb-8 tracking-widest drop-shadow-lg text-center leading-relaxed">السيرة النبوية التفاعلية</h1>
        <p className="text-xl text-neutral-300 mb-12 text-center">رحلة النور.. الخرائط الذهنية لسيرة خير البشر ﷺ</p>
        <button 
          onClick={enterExperience}
          className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-2xl rounded-full shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all transform hover:scale-105"
        >
          {currentSceneIndex > 0 ? "إكمال الرحلة 🧭" : "ابدأ الرحلة 🧭"}
        </button>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen bg-[#cfa568] text-white font-sans flex flex-col items-center justify-center overflow-hidden relative" 
      onClick={() => setInfoPopup({...infoPopup, show: false})}
      dir="rtl"
    >
      <audio ref={audioRef} src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Howling_wind.ogg" loop />

      {/* Intro Background Map simulation */}
      {zoomStage < 2 && (
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center bg-[#cfa568]">
            <p className="text-6xl md:text-8xl font-bold text-[#8b5a2b] opacity-20">{scene.regionName}</p>
        </div>
      )}

      {/* FULL SCREEN MAP CONTAINER */}
      <div 
        className="w-full h-full z-10 relative flex flex-col items-center"
        style={{ 
          position: 'absolute',
          inset: '0',
          transition: 'all 4s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        <div 
          className="relative w-full h-full overflow-hidden bg-black transition-transform origin-center"
          style={{
            transform: zoomStage === 1 ? 'scale(1)' : zoomStage === 2 ? 'scale(1)' : 'scale(0.1)',
            transition: 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)',
            opacity: zoomStage < 2 ? 0.3 : 1
          }}
        >
          <img src={scene.mapImage} alt="خريطة السيرة" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
            {scene.pois.map((poi) => (
              <g 
                key={poi.id}
                transform={`translate(${poi.x}, ${poi.y})`} 
                className="cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={(e) => showInfo(e, poi.name, poi.desc)}
              >
                <circle cx="0" cy="0" r="30" fill="rgba(253, 224, 71, 0.2)" stroke="#fde047" strokeWidth="2" />
                <circle cx="0" cy="0" r="5" fill="#fde047" />
                <text x="0" y="25" fontSize="12" fill="white" textAnchor="middle" fontWeight="bold">{poi.name}</text>
              </g>
            ))}

            <path 
              ref={pathRef}
              d={scene.path}
              fill="none" 
              stroke="#fde047" 
              strokeWidth="4" 
              strokeDasharray="8 8" 
              opacity="0.6"
            />
            
            <g ref={caravanRef} style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
              <circle cx="0" cy="-10" r="30" fill="#fde047" opacity="0.8">
                <animate attributeName="r" values="30;45;30" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="-10" r="12" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 8px white)' }} />
              <text x="0" y="5" fontSize="40" textAnchor="middle" dominantBaseline="middle">{scene.icon}</text>
            </g>
          </svg>
        </div>

        {/* HUD OVERLAY - Title & Subtitles */}
        <div 
          className="absolute top-10 w-full px-5 text-center transition-opacity duration-1000 z-20 pointer-events-none"
          style={{ opacity: zoomStage === 2 ? 1 : 0 }}
        >
          <h1 className="text-amber-400 font-extrabold text-3xl md:text-5xl mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">{scene.title}</h1>
          <div 
            className="text-white font-bold text-xl md:text-2xl min-h-[80px] bg-black/60 backdrop-blur-sm p-4 rounded-xl border border-white/10 max-w-4xl mx-auto shadow-2xl transition-opacity duration-300"
            style={{ opacity: opacity }}
          >
            {commentary}
          </div>
        </div>

        {/* BOTTOM CONTROLS OVERLAY */}
        <div 
          className="absolute bottom-10 w-full px-5 flex flex-col items-center gap-6 transition-opacity duration-1000 z-20"
          style={{ opacity: zoomStage === 2 ? 1 : 0 }}
        >
          {/* Main Actions */}
          <div className="flex justify-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); startJourney(); }} 
              className="px-8 py-3 bg-amber-600 text-white rounded-full font-bold text-lg shadow-lg hover:bg-amber-500 transition-colors"
            >
              ▶️ تشغيل المشهد
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); resetJourney(); }} 
              className="px-8 py-3 bg-black/50 border border-white/20 text-white rounded-full font-bold text-lg shadow-sm hover:bg-black/70 transition-colors"
            >
              🔄 إعادة المشهد
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4 w-full max-w-4xl justify-between border-t border-white/20 pt-4">
            <button 
              onClick={(e) => { e.stopPropagation(); prevScene(); }}
              disabled={currentSceneIndex === 0}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${currentSceneIndex === 0 ? 'opacity-50 cursor-not-allowed bg-transparent text-gray-500' : 'bg-neutral-800 text-white hover:bg-neutral-700'}`}
            >
              ◀ المشهد السابق
            </button>
            <span className="text-neutral-400 font-mono">
              مشهد {currentSceneIndex + 1} من {SCENES.length}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); nextScene(); }}
              disabled={currentSceneIndex === SCENES.length - 1}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${currentSceneIndex === SCENES.length - 1 ? 'opacity-50 cursor-not-allowed bg-transparent text-gray-500' : 'bg-amber-600 text-white hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.4)]'}`}
            >
              المشهد التالي ▶
            </button>
          </div>
        </div>

      </div>

      {/* Info Popup */}
      {infoPopup.show && (
        <div 
          className="fixed z-50 bg-neutral-900 border border-amber-500 rounded-xl p-5 shadow-2xl max-w-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: infoPopup.x, top: infoPopup.y }}
        >
          <h3 className="text-amber-400 font-bold text-xl mb-2">{infoPopup.title}</h3>
          <p className="text-white text-md leading-relaxed">{infoPopup.text}</p>
        </div>
      )}

    </div>
  );
}
