import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, Edit2, Download } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import confetti from 'canvas-confetti';

interface Mission {
  id: string;
  category: 'essential' | 'study' | 'housework';
  text: string;
  isCustom?: boolean;
}

interface DailyRecord {
  date: string;
  missionId: string;
  category: 'essential' | 'study' | 'housework';
  text: string;
  selected: boolean;
  completed: boolean;
}

const INITIAL_MISSIONS: Mission[] = [
  { id: 'e1', category: 'essential', text: '🤖 바닥 완벽 정리' },
  { id: 'e2', category: 'essential', text: '📚 책상 & 책장 정리' },
  { id: 'e3', category: 'essential', text: '🧪 개인 물병 싱크대 놓기' },
  { id: 'e4', category: 'essential', text: '👕 외출복 정리하기' },
  { id: 'e5', category: 'essential', text: '🪥 치카치카 양치 3분' },
  { id: 'e6', category: 'essential', text: '🧼 세수하고 로션 바르기' },
  { id: 'e7', category: 'essential', text: '🎒 내일 학교가방 챙기기' },
  { id: 'e8', category: 'essential', text: '📐 내일 학원가방 챙기기' },

  { id: 's1', category: 'study', text: '🧮 연산 3페이지' },
  { id: 's2', category: 'study', text: '📐 수학 숙제' },
  { id: 's3', category: 'study', text: '🧠 사고력수학문제' },
  { id: 's4', category: 'study', text: '📺 CMS 복습영상 시청' },
  { id: 's5', category: 'study', text: '🇬🇧 영어 문법 학습' },
  { id: 's6', category: 'study', text: '✍️ 세 줄 쓰기 일기' },
  { id: 's7', category: 'study', text: '📰 키즈 신문 읽기' },
  { id: 's8', category: 'study', text: '🧪 영어 과학 원서' },
  { id: 's9', category: 'study', text: '🌅 아침 영어 필사' },
  { id: 's10', category: 'study', text: '📓 수학 일기 작성' },
  { id: 's11', category: 'study', text: '📝 영어 숙제 완수' },
  { id: 's12', category: 'study', text: '🎯 단어 외우기 퀘스트' },

  { id: 'h1', category: 'housework', text: '☀️ 거실 커튼 정리하기' },
  { id: 'h2', category: 'housework', text: '👟 현관 신발 각 세워 정리' },
  { id: 'h3', category: 'housework', text: '🍽️ 식기세척기 그릇 정리 돕기' },
];

export default function App() {
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('quest_missions');
    return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
  });

  const [settings, setSettings] = useState({ studyTarget: 4, houseworkTarget: 1 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'plan' | 'action' | 'success' | 'stats'>('plan');
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [savings, setSavings] = useState<number>(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [newMissionText, setNewMissionText] = useState('');
  const [newMissionCat, setNewMissionCat] = useState<'essential' | 'study' | 'housework'>('study');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    localStorage.setItem('quest_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('quest_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedSavings = localStorage.getItem('quest_savings');
    if (savedSavings) setSavings(Number(savedSavings));

    const savedActive = localStorage.getItem(`quest_active_${todayStr}`);
    const savedSelected = localStorage.getItem(`quest_selected_${todayStr}`);
    const savedCompleted = localStorage.getItem(`quest_completed_${todayStr}`);

    if (savedActive === 'true') {
      setCurrentPhase('action');
      if (savedSelected) setSelectedIds(JSON.parse(savedSelected));
      if (savedCompleted) {
        const parsedCompleted = JSON.parse(savedCompleted);
        setCompletedIds(parsedCompleted);
        const totalToComplete = JSON.parse(savedSelected).length;
        if (parsedCompleted.length === totalToComplete && totalToComplete > 0) {
          setCurrentPhase('success');
        }
      }
    } else {
      const essentials = missions.filter(m => m.category === 'essential').map(m => m.id);
      setSelectedIds(essentials);
    }
  }, []);

  const saveTodayState = (active: boolean, selected: string[], completed: string[]) => {
    localStorage.setItem(`quest_active_${todayStr}`, String(active));
    localStorage.setItem(`quest_selected_${todayStr}`, JSON.stringify(selected));
    localStorage.setItem(`quest_completed_${todayStr}`, JSON.stringify(completed));
  };

  const handleCardClick = (id: string, category: string) => {
    if (currentPhase === 'plan') {
      if (category === 'essential') return;
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else if (currentPhase === 'action') {
      let newCompleted = [...completedIds];
      if (completedIds.includes(id)) {
        newCompleted = newCompleted.filter(i => i !== id);
      } else {
        newCompleted.push(id);
      }
      setCompletedIds(newCompleted);
      saveTodayState(true, selectedIds, newCompleted);

      if (newCompleted.length === selectedIds.length && selectedIds.length > 0) {
        triggerSuccess();
      }
    }
  };

  const triggerSuccess = () => {
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
    const newSavings = savings + 100;
    
    if (newSavings >= 1500) {
      alert("🎉 축하합니다! 15일 보물 수집판을 가득 채워 1500원을 획득했습니다! 부모님께 용돈을 요청하고 다음 도전을 시작하세요. 보관함이 다시 0원부터 시작됩니다.");
      setSavings(0);
      localStorage.setItem('quest_savings', '0');
    } else {
      setSavings(newSavings);
      localStorage.setItem('quest_savings', String(newSavings));
    }

    const currentMissions = missions.filter(m => selectedIds.includes(m.id));
    const newRecords: DailyRecord[] = currentMissions.map(m => ({
      date: todayStr,
      missionId: m.id,
      category: m.category,
      text: m.text,
      selected: true,
      completed: true
    }));

    setHistory(prev => {
      const filtered = prev.filter(h => h.date !== todayStr);
      const updated = [...filtered, ...newRecords];
      localStorage.setItem('quest_history', JSON.stringify(updated));
      return updated;
    });

    setCurrentPhase('success');
  };

  const startTodayQuest = () => {
    const selectedStudyCount = missions.filter(m => m.category === 'study' && selectedIds.includes(m.id)).length;
    const selectedHouseworkCount = missions.filter(m => m.category === 'housework' && selectedIds.includes(m.id)).length;

    if (selectedStudyCount !== settings.studyTarget || selectedHouseworkCount !== settings.houseworkTarget) {
      alert(`🚨 공부 미션 ${settings.studyTarget}개, 집안일 ${settings.houseworkTarget}개를 골라야 전장으로 진입할 수 있어!`);
      return;
    }

    const essentials = missions.filter(m => m.category === 'essential').map(m => m.id);
    const combined = Array.from(new Set([...essentials, ...selectedIds]));
    setSelectedIds(combined);
    
    setCurrentPhase('action');
    saveTodayState(true, combined, []);
  };

  const resetTodayQuest = () => {
    if (window.confirm("🚨 오늘 작전을 해제하고 계획 모드로 복귀할까?")) {
      setCurrentPhase('plan');
      setCompletedIds([]);
      const essentials = missions.filter(m => m.category === 'essential').map(m => m.id);
      setSelectedIds(essentials);
      saveTodayState(false, essentials, []);
    }
  };

  const addMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionText.trim()) return;
    const newId = 'custom_' + Date.now();
    setMissions([...missions, { id: newId, category: newMissionCat, text: newMissionText, isCustom: true }]);
    setNewMissionText('');
  };

  const deleteMission = (id: string) => {
    if (window.confirm("🗑️ 이 항목을 파괴할까?")) {
      setMissions(missions.filter(m => m.id !== id));
      setSelectedIds(selectedIds.filter(i => i !== id));
      setCompletedIds(completedIds.filter(i => i !== id));
    }
  };

  const saveEdit = (id: string) => {
    setMissions(missions.map(m => m.id === id ? { ...m, text: editingText } : m));
    setEditingId(null);
  };

  const exportToCSV = () => {
    if (history.length === 0) {
      alert("📊 축적된 성취 리포트 데이터가 비어 있습니다.");
      return;
    }
    let csvContent = "\uFEFF날짜,카테고리,항목,완료여부\n";
    history.forEach(r => {
      csvContent += `${r.date},${r.category === 'essential' ? '필수' : r.category === 'study' ? '공부' : '집안일'},${r.text.replace(/,/g, '')},O\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DAILYQUEST_REPORT_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChartData = () => {
    const dates = Array.from(new Set(history.map(h => h.date))).sort().slice(-7);
    const lineData = dates.map(d => {
      const dayLogs = history.filter(h => h.date === d);
      return { name: d.slice(5), 격파수: dayLogs.filter(h => h.completed).length };
    });

    const categories = { essential: 0, study: 0, housework: 0 };
    history.forEach(h => { if (categories[h.category] !== undefined) categories[h.category]++; });
    const pieData = [
      { name: '필수', value: categories.essential || 1, color: '#10B981' },
      { name: '공부', value: categories.study || 1, color: '#3B82F6' },
      { name: '집안일', value: categories.housework || 1, color: '#F97316' },
    ];

    const studyCounts: Record<string, number> = {};
    history.filter(h => h.category === 'study').forEach(h => { studyCounts[h.text] = (studyCounts[h.text] || 0) + 1; });
    const barData = Object.keys(studyCounts).map(k => ({ name: k.substring(2, 7), 횟수: studyCounts[k] })).slice(0, 5);

    return { lineData, pieData, barData };
  };

  const { lineData, pieData, barData } = getChartData();
  const coinCount = Math.floor(savings / 100);

  const currentActiveMissions = missions.filter(m => selectedIds.includes(m.id));
  const totalCount = currentActiveMissions.length;
  const completedCount = completedIds.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 select-none flex flex-col justify-between" style={{ minHeight: '100vh', backgroundColor: '#020617', boxSizing: 'border-box' }}>
      
      {/* 🚀 1. 설정 버튼을 우측 상단 지갑 옆으로 완벽 이동한 새로운 슬림 헤더 */}
      <header className="flex justify-between items-center bg-slate-900 border-b-2 border-cyan-500/30 p-2.5 rounded-xl shadow-md" style={{ backgroundColor: '#0f172a', borderBottom: '2px solid rgba(6,182,212,0.3)', padding: '0.6rem 1rem' }}>
        <div>
          <h1 className="text-xl font-black tracking-wider text-cyan-400 m-0" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#22d3ee' }}>DAILY QUEST</h1>
        </div>

        {/* 지갑 및 설정 그룹 */}
        <div className="flex items-center gap-3.5" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* 보물 상자 */}
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-yellow-500/40 flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#020617', border: '1px solid rgba(234,179,8,0.4)', padding: '0.4rem 0.8rem' }}>
            <span className="text-xl animate-pulse" style={{ fontSize: '1.25rem' }}>💎</span>
            <div className="text-left">
              <div className="text-[9px] text-yellow-500 font-black" style={{ fontSize: '9px', color: '#eab308' }}>COMMANDER SAVINGS</div>
              <div className="text-base font-black text-yellow-400 p-0 m-0 leading-tight" style={{ fontSize: '1.1rem', fontWeight: 900, color: '#facc15' }}>{savings} 원</div>
            </div>
          </div>
          
          {/* 우측 상단으로 이동한 에디터 설정 버튼 */}
          <button 
            type="button" 
            onClick={() => setIsEditorOpen(true)}
            className="bg-slate-950 text-cyan-400 font-bold p-2 text-base rounded-xl border border-slate-700 active:scale-90 transition-all cursor-pointer"
            style={{ backgroundColor: '#020617', border: '1px solid #334155', padding: '0.45rem 0.8rem', borderRadius: '0.75rem', color: '#22d3ee' }}
          >
            ⚙️ 설정
          </button>
        </div>
      </header>

      {/* 🛠️ 메인 격파 센터 */}
      <main className="flex-1 w-full max-w-5xl mx-auto my-2" style={{ width: '100%', margin: '0.5rem auto' }}>
        
        {/* ==========================================
            [PHASE 1] 계획 수립 페이즈
            ========================================== */}
        {currentPhase === 'plan' && (
          <div className="flex flex-col gap-3">
            {/* 2. 작전 계획 수립 프로토콜 -> 작전 계획 문구 변경 */}
            <div className="bg-slate-900 p-3 rounded-xl border border-cyan-500/40 text-center flex items-center justify-between gap-4" style={{ backgroundColor: '#0f172a', border: '1px solid #06b6d4', padding: '0.75rem 1rem' }}>
              <div className="text-left">
                <h2 className="text-base font-black text-cyan-400 m-0" style={{ fontSize: '1.05rem', color: '#22d3ee' }}>🎯 작전 계획</h2>
                <p className="text-xs text-slate-400 m-0" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>공부 {settings.studyTarget}개 + 집안일 {settings.houseworkTarget}개를 터치 장착해라!</p>
              </div>
              <button
                type="button"
                onClick={startTodayQuest}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm px-6 py-2.5 rounded-xl tracking-wider active:scale-95 transition-all cursor-pointer shadow-lg"
                style={{ background: 'linear-gradient(to right, #06b6d4, #2563eb)', color: '#020617', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontWeight: 900, fontSize: '0.9rem', border: 'none' }}
              >
                🚀 오늘 작전 개시! 
              </button>
            </div>

            {/* 3. 공부 강화 퀘스트 -> 오늘의 머리운동 4개 고르자 변경 */}
            <section>
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-sm font-black text-blue-400 m-0" style={{ color: '#3b82f6', fontSize: '0.9rem' }}>🧠 오늘의 머리운동 {settings.studyTarget}개 고르자</h3>
                <span className="text-[10px] font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full">{missions.filter(m => m.category === 'study' && selectedIds.includes(m.id)).length} / {settings.studyTarget} 선택</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {missions.filter(m => m.category === 'study').map(m => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleCardClick(m.id, m.category)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '3.6rem', padding: '0.75rem', borderRadius: '0.75rem', border: isSelected ? '2px solid #3b82f6' : '1px solid #1e293b', backgroundColor: isSelected ? '#1e3a8a' : '#0f172a', color: '#ffffff', textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.text}</span>
                      <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.35rem', border: '1px solid #475569', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#3b82f6' : 'transparent', fontSize: '0.7rem' }}>{isSelected && "✓"}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. 집안일 서포트 기여 -> 집안일도 고르자 변경 */}
            <section>
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-sm font-black text-orange-400 m-0" style={{ color: '#f97316', fontSize: '0.9rem' }}>🏡 집안일도 고르자</h3>
                <span className="text-[10px] font-bold bg-orange-950 text-orange-300 px-2 py-0.5 rounded-full">{missions.filter(m => m.category === 'housework' && selectedIds.includes(m.id)).length} / {settings.houseworkTarget} 선택</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {missions.filter(m => m.category === 'housework').map(m => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleCardClick(m.id, m.category)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '3.6rem', padding: '0.75rem', borderRadius: '0.75rem', border: isSelected ? '2px solid #f97316' : '1px solid #1e293b', backgroundColor: isSelected ? '#7c2d12' : '#0f172a', color: '#ffffff', textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.text}</span>
                      <div style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.35rem', border: '1px solid #475569', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#f97316' : 'transparent', fontSize: '0.7rem' }}>{isSelected && "✓"}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ==========================================
            [PHASE 2] 작전 실행 페이즈
            ========================================== */}
        {currentPhase === 'action' && (
          <div className="flex flex-col gap-3">
            {/* 5. 실시간 하이테크 레이더 모드 -> 임무 완료 후 누르자 변경 */}
            <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800" style={{ backgroundColor: '#0f172a', padding: '0.6rem 1rem' }}>
              <div className="text-left">
                <h2 className="text-sm font-black text-white m-0">⚡ 임무 완료 후 누르자</h2>
                <div style={{ width: '12rem', backgroundColor: '#020617', height: '0.75rem', borderRadius: '9999px', marginTop: '0.3rem', border: '1px solid #1e293b', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(to right, #22d3ee, #10b981)', width: `${progressPercent}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div style={{ backgroundColor: '#020617', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <span style={{ color: '#10b981' }}>{completedCount}</span> / {totalCount} 완료
                </div>
                <button type="button" onClick={resetTodayQuest} className="text-[10px] font-bold text-red-400 bg-red-950/20 px-2.5 py-1.5 rounded-lg border border-red-900/40 cursor-pointer">🔄 리셋</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {currentActiveMissions.map(m => {
                const isCompleted = completedIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleCardClick(m.id, m.category)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '3.8rem', padding: '0.75rem', borderRadius: '0.75rem', border: isCompleted ? '1px solid #10b981' : '1px solid #475569', backgroundColor: isCompleted ? '#064e3b' : '#0f172a', color: '#ffffff', textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: isCompleted ? '#a7f3d0' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.text}</span>
                    <div>
                      {isCompleted ? (
                        <span style={{ backgroundColor: '#10b981', color: '#020617', fontWeight: 900, fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '0.25rem' }}>OK</span>
                      ) : (
                        <div style={{ width: '1.1rem', height: '1.1rem', borderRadius: '9999px', border: '1px solid #475569' }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            [PHASE 3] 저금통 화면
            ========================================== */}
        {currentPhase === 'success' && (
          <div className="flex flex-col gap-3 max-w-xl mx-auto text-center">
            {/* 6. 문구 변경 -> 오늘의 미션 완료! 대성공이군! */}
            <div className="bg-slate-900 border-2 border-yellow-500 rounded-2xl p-5" style={{ backgroundColor: '#0f172a', border: '2px solid #eab308' }}>
              <div className="text-4xl mb-1">💎</div>
              <h2 className="text-xl font-black text-yellow-400 m-0 tracking-wide">TODAY'S MISSION COMPLETE</h2>
              <p className="text-xs text-slate-300 mt-1">오늘의 미션 완료! 대성공이군!</p>
              
              <div className="py-4">
                <motion.div 
                  initial={{ rotateY: 0, scale: 0.8 }} 
                  animate={{ rotateY: 360, scale: [1, 1.15, 1] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
                  style={{ fontSize: '4.5rem', textShadow: '0 0 20px rgba(234,179,8,0.6)' }}
                >
                  💎
                </motion.div>
              </div>

              <div className="text-lg font-black text-white bg-slate-950 py-2 rounded-xl border border-slate-800">
                보물 입고: +100 원 완료
              </div>
            </div>

            {/* 7. 보물 축적 전장판 -> 보물 수집판 변경 */}
            {/* 8. 1/15 격파 -> 1/15 수집 변경 */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-yellow-500">🎖️ 보물 수집판</span>
                <span className="text-[11px] text-slate-400 font-bold">{coinCount} / 15 수집</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div 
                    key={i} 
                    style={{ aspectRatio: '1/1', borderRadius: '0.75rem', border: '1px solid #1e293b', display: 'flex items-center justify-center', fontSize: '1.25rem', fontWeight: 900, backgroundColor: i < coinCount ? '#eab308' : '#020617', color: i < coinCount ? '#020617' : '#475569', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {i < coinCount ? '💎' : i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setCurrentPhase('stats')} className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black py-3 rounded-xl border-none cursor-pointer text-sm">📊 분석 일지 열기</button>
              <button type="button" onClick={resetTodayQuest} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-3 rounded-xl border border-slate-700 cursor-pointer text-sm">🔄 새로 시작</button>
            </div>
          </div>
        )}

        {/* ==========================================
            [PHASE 4] 부모님 데이터 분석실
            ========================================== */}
        {currentPhase === 'stats' && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl">
              <div>
                <h2 className="text-base font-black m-0">📊 사령부 종합 전술 분석실</h2>
                <p className="text-[11px] text-slate-400 m-0">아동의 축적 데이터 로그 시각화 패널입니다.</p>
              </div>
              <button type="button" onClick={exportToCSV} className="bg-emerald-600 text-slate-950 font-black text-xs px-3 py-2 rounded-lg border-none cursor-pointer">💾 성취 데이터 일지 CSV 백업</button>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="격파수" stroke="#06b6d4" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={4} dataKey="value">
                        {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} />
                      <YAxis stroke="#94a3b8" fontSize={9} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="횟수" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setCurrentPhase('plan')} className="bg-slate-800 text-slate-300 font-black py-3 rounded-xl border border-slate-700 cursor-pointer text-sm">⬅ shrink 제어판 중앙 메인으로 복귀</button>
          </div>
        )}
      </main>

      {/* 🛠️ 설정 모달 에디터 */}
      <AnimatePresence>
        {isEditorOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,6,23,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifycontent: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: '#0f172a', width: '100%', maxWidth: '34rem', borderRadius: '1.25rem', border: '2px solid #334155', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 900 }}>🛠️ 작전 타깃 데이터 허브 에디터</h3>
                <button type="button" onClick={() => setIsEditorOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#020617', padding: '0.75rem', borderRadius: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>공부 목표 (개)</label>
                  <input type="number" min={1} max={12} value={settings.studyTarget} onChange={(e) => setSettings({ ...settings, studyTarget: Number(e.target.value) })} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.4rem', padding: '0.4rem', color: '#fff', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '0.15rem' }}>집안일 목표 (개)</label>
                  <input type="number" min={0} max={5} value={settings.houseworkTarget} onChange={(e) => setSettings({ ...settings, houseworkTarget: Number(e.target.value) })} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.4rem', padding: '0.4rem', color: '#fff', fontWeight: 700 }} />
                </div>
              </div>

              <form onSubmit={addMission} style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#020617', padding: '0.4rem', borderRadius: '0.75rem' }}>
                <select value={newMissionCat} onChange={(e: any) => setNewMissionCat(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.4rem', padding: '0.4rem', color: '#fff' }}><option value="essential">필수</option><option value="study">공부</option><option value="housework">집안일</option></select>
                <input type="text" placeholder="새 미션 명칭 입력" value={newMissionText} onChange={(e) => setNewMissionText(e.target.value)} style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.4rem', padding: '0.4rem', color: '#fff', fontSize: '0.8rem' }} />
                <button type="submit" style={{ backgroundColor: '#06b6d4', color: '#020617', fontWeight: 900, border: 'none', padding: '0.4rem 0.8rem', borderRadius: '0.4rem', cursor: 'pointer' }}>등록</button>
              </form>

              <div style={{ maxHeight: '10rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {missions.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', padding: '0.4rem 0.6rem', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                      <span style={{ fontSize: '8px', fontWeight: 900, padding: '0.1rem 0.3rem', borderRadius: '0.2rem', backgroundColor: '#1e293b' }}>{m.category === 'essential' ? '필수' : m.category === 'study' ? '공부' : '집안일'}</span>
                      {editingId === m.id ? (
                        <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.2rem', borderRadius: '0.2rem', fontSize: '0.7rem', flex: 1 }} />
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{m.text}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {editingId === m.id ? (
                        <button type="button" onClick={() => saveEdit(m.id)} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>✓</button>
                      ) : (
                        <button type="button" onClick={() => { setEditingId(m.id); setEditingText(m.text); }} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                      )}
                      <button type="button" onClick={() => deleteMission(m.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'right', borderTop: '1px solid #1e293b', paddingTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsEditorOpen(false)} style={{ backgroundColor: '#334155', color: '#fff', fontWeight: 700, padding: '0.4rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>닫기</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
