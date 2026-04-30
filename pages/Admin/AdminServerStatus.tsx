import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, 
  Database, 
  Network, 
  Users, 
  Activity, 
  CloudRain, 
  Zap, 
  ArrowRightLeft, 
  ArrowDown, 
  RefreshCw,
  Laptop
} from 'lucide-react';
import clsx from 'clsx';

export const AdminServerStatus = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [serverLoads, setServerLoads] = useState([45, 42, 48, 35, 50, 41]);
  const [requests, setRequests] = useState<{ id: number, server: number, offset: number }[]>([]);
  const requestCounter = useRef(0);

  useEffect(() => {
    setIsLoaded(true);

    // Simulate Load Balancer Activity (Round Robin Algorithm)
    const interval = setInterval(() => {
      setActiveServerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % 6;
        
        // Spawn a request animation
        const offset = Math.random() * 20 - 10; // Random offset for organic look
        setRequests(reqs => [...reqs.slice(-10), { id: requestCounter.current++, server: nextIndex, offset }]);
        
        // Update simulated server loads based on active distribution
        setServerLoads(loads => {
          const newLoads = [...loads];
          // Increase load on targeted server
          newLoads[nextIndex] = Math.min(95, newLoads[nextIndex] + Math.random() * 10 + 5);
          // Decrease load on other servers (cooling down)
          return newLoads.map((l, i) => i === nextIndex ? l : Math.max(15, l - Math.random() * 5 - 2));
        });

        return nextIndex;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const NodeCard = ({ title, icon: Icon, color, children, className = "", isActive = false }: any) => (
    <div className={clsx(
      "bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border-2 transition-all duration-300 relative transition-colors",
      color === 'blue' ? "border-blue-100 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700" :
      color === 'green' ? "border-emerald-100 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700" :
      color === 'purple' ? "border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700" :
      "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
      isActive && "shadow-[0_0_20px_rgba(16,185,129,0.4)] border-emerald-400 dark:border-emerald-500 scale-[1.02]",
      className
    )}>
      {isActive && (
        <span className="absolute -top-2 -right-2 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
        </span>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className={clsx(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          color === 'blue' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
          color === 'green' ? (isActive ? "bg-emerald-500 text-white" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400") :
          color === 'purple' ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" :
          "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        )}>
          <Icon size={24} />
        </div>
        <h3 className="font-black text-lg text-slate-800 dark:text-white transition-colors">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500 transition-colors">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4 transition-colors">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2 transition-colors">লোড ব্যালেন্সিং ও সার্ভার স্ট্যাটাস</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Automatic Traffic Distribution & Load Balancing System</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-800/50 transition-colors">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 cursor-pointer"></span>
          </span>
          অটো-স্কেলিং সক্রিয়
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[700px] transition-colors">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative z-10 flex flex-col items-center justify-between h-full gap-10">
          
          {/* Users Tier */}
          <div className="w-full flex flex-col items-center pt-4 transition-colors">
            <div className="flex items-center justify-center gap-4 lg:gap-6 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={clsx(
                  "w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md transition-all duration-700 relative transition-colors",
                  isLoaded ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
                )} style={{ transitionDelay: `${i * 100}ms` }}>
                  <Laptop size={24} className="text-slate-500 dark:text-slate-400 transition-colors" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full"></span>
                </div>
              ))}
            </div>
            <div className="bg-slate-800 dark:bg-slate-900 text-white dark:text-slate-300 px-6 py-2 rounded-full font-bold shadow-[0_10px_30px_-10px_rgba(30,41,59,0.5)] flex items-center gap-3 transition-colors border dark:border-slate-800">
              ইন্টারনেট ব্যবহারকারী (Clients)
            </div>
          </div>

          {/* Load Balancer */}
          <div className="w-full flex flex-col items-center relative">
            <div className="absolute top-[-40px] flex gap-1">
               <ArrowDown size={24} className="text-blue-400 animate-bounce" />
            </div>
            <NodeCard title="সেন্ট্রাল লোড ব্যালেন্সার" icon={Network} color="blue" className="w-full max-w-md text-center z-20">
              <div className="flex items-center justify-center gap-4 text-slate-500 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-xl transition-colors">
                <ArrowRightLeft size={24} className="text-blue-500 dark:text-blue-400" />
                <span className="font-bold text-blue-700 dark:text-blue-400 tracking-wide uppercase text-sm transition-colors">Round Robin Routing</span>
              </div>
            </NodeCard>
            
            {/* Animated Traffic Particles */}
            {requests.map(req => (
              <div 
                key={req.id}
                className={clsx(
                  "absolute w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] z-10 animate-traffic",
                  req.server === 0 ? "traffic-1" :
                  req.server === 1 ? "traffic-2" :
                  req.server === 2 ? "traffic-3" :
                  req.server === 3 ? "traffic-4" :
                  req.server === 4 ? "traffic-5" :
                  "traffic-6"
                )}
                style={{ marginLeft: `${req.offset}px` }}
              />
            ))}
          </div>

          {/* Servers Tier */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-20">
            {/* Server 1 */}
            <NodeCard title="সার্ভার নোড ১" icon={Server} color="green" isActive={activeServerIndex === 0}>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 transition-colors">
                    <span>CPU Load</span>
                    <span className={clsx(
                      serverLoads[0] > 80 ? "text-red-500" :
                      serverLoads[0] > 60 ? "text-orange-500" : "text-emerald-500"
                    )}>{serverLoads[0].toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000",
                        serverLoads[0] > 80 ? "bg-red-500" :
                        serverLoads[0] > 60 ? "bg-orange-500" : "bg-emerald-500"
                      )} 
                      style={{ width: `${serverLoads[0]}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg text-center font-mono border dark:border-slate-800 transition-colors">
                  10.124.0.1 (Active)
                </div>
              </div>
            </NodeCard>

            {/* Server 2 */}
            <NodeCard title="সার্ভার নোড ২" icon={Server} color="green" isActive={activeServerIndex === 1}>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 transition-colors">
                    <span>CPU Load</span>
                    <span className={clsx(
                      serverLoads[1] > 80 ? "text-red-500" :
                      serverLoads[1] > 60 ? "text-orange-500" : "text-emerald-500"
                    )}>{serverLoads[1].toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000",
                        serverLoads[1] > 80 ? "bg-red-500" :
                        serverLoads[1] > 60 ? "bg-orange-500" : "bg-emerald-500"
                      )} 
                      style={{ width: `${serverLoads[1]}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg text-center font-mono border dark:border-slate-800 transition-colors">
                  10.124.0.2 (Active)
                </div>
              </div>
            </NodeCard>

            {/* Server 3 */}
            <NodeCard title="সার্ভার নোড ৩" icon={Server} color="green" isActive={activeServerIndex === 2}>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 transition-colors">
                    <span>CPU Load</span>
                    <span className={clsx(
                      serverLoads[2] > 80 ? "text-red-500" :
                      serverLoads[2] > 60 ? "text-orange-500" : "text-emerald-500"
                    )}>{serverLoads[2].toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000",
                        serverLoads[2] > 80 ? "bg-red-500" :
                        serverLoads[2] > 60 ? "bg-orange-500" : "bg-emerald-500"
                      )} 
                      style={{ width: `${serverLoads[2]}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg text-center font-mono border dark:border-slate-800 transition-colors">
                   10.124.0.3 (Active)
                </div>
              </div>
            </NodeCard>

            {/* Server 4 */}
            <NodeCard title="সার্ভার নোড ৪" icon={Server} color="green" isActive={activeServerIndex === 3}>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 transition-colors">
                    <span>CPU Load</span>
                    <span className={clsx(
                      serverLoads[3] > 80 ? "text-red-500" :
                      serverLoads[3] > 60 ? "text-orange-500" : "text-emerald-500"
                    )}>{serverLoads[3].toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000",
                        serverLoads[3] > 80 ? "bg-red-500" :
                        serverLoads[3] > 60 ? "bg-orange-500" : "bg-emerald-500"
                      )} 
                      style={{ width: `${serverLoads[3]}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg text-center font-mono border dark:border-slate-800 transition-colors">
                   10.124.0.4 (Active)
                </div>
              </div>
            </NodeCard>

            {/* Server 5 */}
            <NodeCard title="সার্ভার নোড ৫" icon={Server} color="green" isActive={activeServerIndex === 4}>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 transition-colors">
                    <span>CPU Load</span>
                    <span className={clsx(
                      serverLoads[4] > 80 ? "text-red-500" :
                      serverLoads[4] > 60 ? "text-orange-500" : "text-emerald-500"
                    )}>{serverLoads[4].toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000",
                        serverLoads[4] > 80 ? "bg-red-500" :
                        serverLoads[4] > 60 ? "bg-orange-500" : "bg-emerald-500"
                      )} 
                      style={{ width: `${serverLoads[4]}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg text-center font-mono border dark:border-slate-800 transition-colors">
                   10.124.0.5 (Active)
                </div>
              </div>
            </NodeCard>

            {/* Server 6 */}
            <NodeCard title="সার্ভার নোড ৬" icon={Server} color="green" isActive={activeServerIndex === 5}>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1 transition-colors">
                    <span>CPU Load</span>
                    <span className={clsx(
                      serverLoads[5] > 80 ? "text-red-500" :
                      serverLoads[5] > 60 ? "text-orange-500" : "text-emerald-500"
                    )}>{serverLoads[5].toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000",
                        serverLoads[5] > 80 ? "bg-red-500" :
                        serverLoads[5] > 60 ? "bg-orange-500" : "bg-emerald-500"
                      )} 
                      style={{ width: `${serverLoads[5]}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg text-center font-mono border dark:border-slate-800 transition-colors">
                   10.124.0.6 (Active)
                </div>
              </div>
            </NodeCard>
          </div>

        </div>

      </div>
      
      {/* CSS for traffic animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flow1 {
          0% { top: 50%; left: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { top: 75%; left: 16.66%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }
        @keyframes flow2 {
          0% { top: 50%; left: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { top: 75%; left: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }
        @keyframes flow3 {
          0% { top: 50%; left: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { top: 75%; left: 83.33%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }
        @keyframes flow4 {
          0% { top: 50%; left: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { top: 95%; left: 16.66%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }
        @keyframes flow5 {
          0% { top: 50%; left: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { top: 95%; left: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }
        @keyframes flow6 {
          0% { top: 50%; left: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { top: 95%; left: 83.33%; opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }
        .animate-traffic {
          top: 50%;
          left: 50%;
          animation-duration: 1.5s;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-fill-mode: forwards;
        }
        .traffic-1 { animation-name: flow1; }
        .traffic-2 { animation-name: flow2; }
        .traffic-3 { animation-name: flow3; }
        .traffic-4 { animation-name: flow4; }
        .traffic-5 { animation-name: flow5; }
        .traffic-6 { animation-name: flow6; }
      `}} />
    </div>
  );
};
