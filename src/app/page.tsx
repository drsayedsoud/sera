"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Map, { Source, Layer, Marker, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const MECCA: [number, number] = [39.8262, 21.4225];
const TAIF: [number, number] = [40.4062, 21.2703];

// Create a realistic winding curved path through the mountains
const routeLine = turf.lineString([MECCA, [40.0, 21.40], [40.2, 21.35], TAIF]);
const curvedRoute = turf.bezierSpline(routeLine, { resolution: 10000 });
const ROUTE_LENGTH = turf.length(curvedRoute); // in kilometers

const DURATION = 20000; // 20 seconds for the journey animation

const scriptText = [
  { time: 0, text: "🎙️ الراوي: تحركت القافلة المكونة من 10 حمير وجملين من وادي مكة..." },
  { time: 4000, text: "🎙️ أخذت حليمة الرضيع اليتيم 'محمداً' ﷺ، وركبت أتانها القمراء الضعيفة." },
  { time: 8000, text: "🎙️ تشق القافلة طريقها بين جبال الحجاز الوعرة باتجاه الطائف." },
  { time: 13000, text: "🎙️ ببركة النبي ﷺ، نشطت الأتان وسبقت القافلة كلها وسط ذهول نساء بني سعد!" },
  { time: 18000, text: "🎙️ حلت البركة العظيمة في ديار بني سعد بمقدم النبي ﷺ." }
];

export default function Home() {
  const mapRef = useRef<MapRef>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const [hasStarted, setHasStarted] = useState(false);
  const [commentary, setCommentary] = useState("اضغط على 'ابدأ المشهد' لمرافقة القافلة في الطيران 🚁...");
  const [opacity, setOpacity] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [caravanPos, setCaravanPos] = useState<[number, number]>(MECCA);
  const [zoomStage, setZoomStage] = useState(0); // 0: Start, 1: Journey
  const [infoPopup, setInfoPopup] = useState<{show: boolean, title: string, text: string}>({show: false, title: "", text: ""});

  const enterExperience = () => {
    setHasStarted(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(e => console.log("Audio blocked", e));
    }
  };

  const startJourney = () => {
    if (isAnimating) return;
    resetJourney();
    setZoomStage(1);
    
    // Slight delay before movement starts to let camera zoom down to Mecca
    setTimeout(() => {
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
    }, 2000);
  };

  const animate = (startTime: number, currentTime: number) => {
    const elapsed = currentTime - startTime;
    let progress = elapsed / DURATION;
    if (progress > 1) progress = 1;
    
    // Calculate current position along the route
    const distanceToTravel = ROUTE_LENGTH * progress;
    const currentPoint = turf.along(curvedRoute, distanceToTravel).geometry.coordinates as [number, number];
    setCaravanPos(currentPoint);

    // Calculate bearing (direction) to look ahead
    const aheadPoint = turf.along(curvedRoute, Math.min(distanceToTravel + 0.5, ROUTE_LENGTH)).geometry.coordinates;
    const bearing = turf.bearing(turf.point(currentPoint), turf.point(aheadPoint));

    // Fly camera closely behind the caravan
    if (mapRef.current) {
      mapRef.current.jumpTo({
        center: currentPoint,
        zoom: 12.5, // Zoomed in closely
        pitch: 75,  // Highly tilted to see the 3D mountains
        bearing: bearing
      });
    }

    if (progress < 1) {
      animationRef.current = requestAnimationFrame((time) => animate(startTime, time));
    } else {
      setIsAnimating(false);
      // Final cinematic orbit around Taif
      if (mapRef.current) {
        mapRef.current.easeTo({
          center: TAIF,
          zoom: 11,
          pitch: 60,
          bearing: bearing + 90,
          duration: 5000
        });
      }
    }
  };

  const resetJourney = () => {
    setIsAnimating(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
    
    setCaravanPos(MECCA);
    setOpacity(1);
    setCommentary("اضغط على 'ابدأ المشهد' لمرافقة القافلة في الطيران 🚁...");

    // Reset Camera to wide shot of Mecca
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: MECCA,
        zoom: 10,
        pitch: 45,
        bearing: 0,
        duration: 2000
      });
    }
  };

  const showInfo = (title: string, text: string) => {
    setInfoPopup({ show: true, title, text });
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white" dir="rtl">
        <h1 className="text-4xl md:text-6xl font-bold text-amber-400 mb-8 tracking-widest drop-shadow-lg text-center leading-relaxed">السيرة النبوية التفاعلية 3D</h1>
        <p className="text-xl text-neutral-300 mb-12 text-center max-w-2xl leading-relaxed">
          انضم إلينا في أول تجربة سينمائية تطير بك فوق التضاريس الحقيقية ثلاثية الأبعاد للجزيرة العربية، وتتبع خطى الحبيب ﷺ.
        </p>
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
    <div className="h-screen w-screen bg-black text-white font-sans flex flex-col overflow-hidden relative" dir="rtl">
      <audio ref={audioRef} src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Howling_wind.ogg" loop />

      {/* 3D Map Container */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: MECCA[0],
            latitude: MECCA[1],
            zoom: 7, // Starts Wide
            pitch: 60,
            bearing: -20
          }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
          projection={{ name: "globe" }} // Renders as a 3D globe when zoomed out
        >
          {/* 3D Terrain Data Source */}
          <Source
            id="mapbox-dem"
            type="raster-dem"
            url="mapbox://mapbox.mapbox-terrain-dem-v1"
            tileSize={512}
            maxzoom={14}
          />

          {/* Sky layer for realistic atmosphere */}
          <Layer
            id="sky"
            type="sky"
            paint={{
              "sky-type": "atmosphere",
              "sky-atmosphere-sun": [0.0, 0.0],
              "sky-atmosphere-sun-intensity": 15
            }}
          />

          {/* Draw the Route Line on the ground */}
          <Source id="route" type="geojson" data={curvedRoute}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                "line-color": "#fde047",
                "line-width": 4,
                "line-opacity": 0.6,
                "line-dasharray": [2, 2]
              }}
            />
          </Source>

          {/* Mecca POI */}
          <Marker longitude={MECCA[0]} latitude={MECCA[1]} anchor="bottom">
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => showInfo("مكة المكرمة", "البلد الحرام. المسافة إلى الطائف تزيد عن 100 كيلومتر عبر الجبال الوعرة.")}
            >
              <div className="text-4xl">🕋</div>
              <div className="bg-black/70 px-3 py-1 rounded-full text-amber-400 font-bold text-sm mt-1 border border-amber-400/50">مكة المكرمة</div>
            </div>
          </Marker>

          {/* Taif POI */}
          <Marker longitude={TAIF[0]} latitude={TAIF[1]} anchor="bottom">
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => showInfo("الطائف (ديار بني سعد)", "مدينة مرتفعة، وتتميز ببرودة طقسها وهواءها النقي. هنا حلت البركة بمقدم النبي ﷺ.")}
            >
              <div className="text-4xl">⛰️</div>
              <div className="bg-black/70 px-3 py-1 rounded-full text-green-400 font-bold text-sm mt-1 border border-green-400/50">الطائف</div>
            </div>
          </Marker>

          {/* Caravan Marker (10 Donkeys + 2 Camels) */}
          <Marker longitude={caravanPos[0]} latitude={caravanPos[1]} anchor="center">
            <div className="relative flex justify-center items-center">
              {/* Glowing Aura */}
              <div className="absolute w-24 h-24 bg-amber-400/30 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute w-12 h-12 bg-white/50 rounded-full blur-md"></div>
              {/* Exactly 10 donkeys and 2 camels in a row/grid to represent the caravan */}
              <div className="relative text-2xl drop-shadow-2xl bg-black/40 p-2 rounded-2xl border border-amber-400/30 backdrop-blur-sm flex flex-col items-center">
                <div className="text-sm font-bold text-amber-300 mb-1">القافلة</div>
                <div className="flex gap-1">
                  <span>🫏🫏🫏🫏🫏</span>
                </div>
                <div className="flex gap-1">
                  <span>🫏🫏🫏🫏🫏</span>
                </div>
                <div className="flex gap-1 mt-1">
                  <span>🐫🐫</span>
                </div>
              </div>
            </div>
          </Marker>
        </Map>
      </div>

      {/* HUD OVERLAY - Title & Subtitles */}
      <div 
        className="absolute top-10 w-full px-5 text-center transition-opacity duration-1000 z-20 pointer-events-none"
      >
        <h1 className="text-amber-400 font-extrabold text-3xl md:text-5xl mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">رحلة النور إلى الطائف (3D)</h1>
        <div 
          className="text-white font-bold text-xl md:text-2xl min-h-[80px] bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/20 max-w-4xl mx-auto shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-opacity duration-300"
          style={{ opacity: opacity }}
        >
          {commentary}
        </div>
      </div>

      {/* BOTTOM CONTROLS OVERLAY */}
      <div className="absolute bottom-10 w-full px-5 flex justify-center gap-4 z-20">
        <button 
          onClick={startJourney} 
          className="px-8 py-4 bg-amber-600/90 backdrop-blur-md text-white rounded-full font-bold text-xl shadow-[0_0_20px_rgba(217,119,6,0.6)] hover:bg-amber-500 transition-colors border border-amber-400/50"
        >
          ▶️ تحليق مع القافلة
        </button>
        <button 
          onClick={resetJourney} 
          className="px-8 py-4 bg-black/60 backdrop-blur-md border border-white/30 text-white rounded-full font-bold text-xl shadow-sm hover:bg-black/80 transition-colors"
        >
          🔄 إعادة
        </button>
      </div>

      {/* Info Popup */}
      {infoPopup.show && (
        <div 
          className="absolute z-50 bg-black/80 backdrop-blur-lg border border-amber-500 rounded-xl p-6 shadow-2xl max-w-md transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 text-center"
        >
          <h3 className="text-amber-400 font-bold text-2xl mb-3">{infoPopup.title}</h3>
          <p className="text-white text-lg leading-relaxed">{infoPopup.text}</p>
          <button 
            className="mt-4 px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-bold text-white transition-colors"
            onClick={() => setInfoPopup({...infoPopup, show: false})}
          >
            إغلاق
          </button>
        </div>
      )}

    </div>
  );
}
