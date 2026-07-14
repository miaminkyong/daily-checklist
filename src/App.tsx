import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, Edit2, Download, X } from 'lucide-react';
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
    setSavings(newSavings);
    localStorage.setItem('quest_savings', String(newSavings));

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
      alert(`🚨 공부 미션은 정확히 ${settings.studyTarget}개, 집안일은 ${settings.houseworkTarget}개를 골라야 작전을 시작할 수 있어!`);
      return;
    }

    const essentials = missions.filter(m => m.category === 'essential').map(m => m.id);
    const combined = Array.from(new Set([...essentials, ...selectedIds]));
    setSelectedIds(combined);
    
    setCurrentPhase('action');
    saveTodayState(true, combined, []);
  };

  const resetTodayQuest = () => {
    if (window.confirm("🚨 오늘 작전을 리셋하고 아침으로 돌아갈까요?")) {
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
    if (window.confirm("🗑️ 이 항목을 영구 삭제할까?")) {
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
      alert("📊 축적된 전술 분석 일지가 존재하지 않습니다.");
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
      const comp = dayLogs.filter(h => h.completed).length;
      return { name: d.slice(5), 완료수: comp };
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
    const barData = Object.keys(studyCounts).map(k => ({ name: k.substring(2, 8), 수행횟수: studyCounts[k] })).slice(0, 5);

    return { lineData, pieData, barData };
  };

  const { lineData, pieData, barData } = getChartData();
  const coinCount = Math.min(15, Math.floor(savings / 100));

  const currentActiveMissions = missions.filter(m => selectedIds.includes(m.id));
  const totalCount = currentActiveMissions.length;
  const completedCount = completedIds.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans select-none pb-24 relative" style={{ minHeight: '100vh', backgroundColor: '#020617', paddingBottom: '6rem' }}>
      
      {/* 사이버 작전실 헤더 */}
      <header className="bg-slate-900 border-b-4 border-cyan-500/40 p-4 sticky top-0 z-40 shadow-2xl flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '1rem', borderBottom: '4px solid rgba(6,182,212,0.4)' }}>
        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            type="button" 
            onClick={() => setIsEditorOpen(true)}
            className="bg-slate-950 border border-slate-700 hover:border-cyan-400 p-3 rounded-2xl text-cyan-400 shadow-md transition-all active:scale-90"
            style={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '1rem', padding: '0.75rem', color: '#22d3ee', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✏️
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-cyan-400 game-font" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22d3ee', margin: 0 }}>DAILY QUEST</h1>
            <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase" style={{ fontSize: '10px', color: '#06b6d4', margin: 0 }}>Combat Controller v2.0</p>
          </div>
        </div>

        {/* 대형 보물창고 */}
        <div className="bg-slate-950 px-5 py-2.5 rounded-2xl border-2 border-yellow-500/50 flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.2)]" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#020617', border: '2px solid rgba(234,179,8,0.5)', borderRadius: '1rem', padding: '0.5rem 1rem' }}>
          <span className="text-3xl animate-bounce" style={{ fontSize: '1.875rem' }}>🪙</span>
          <div>
            <div className="text-[10px] text-yellow-500 font-black tracking-widest" style={{ fontSize: '10px', color: '#eab308', fontWeight: 900 }}>COMMANDER GOLD</div>
            <div className="text-xl font-black text-yellow-400" style={{ fontSize: '1.25rem', fontWeight: 900, color: '#facc15' }}>{savings} 원</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-4" style={{ maxWidth: '56rem', margin: '1rem auto', padding: '1rem' }}>
        
        {/* ==========================================
            [PHASE 1] 계획 수립 화면 (최상단에 시작 버튼 배치완료)
            ========================================== */}
        {currentPhase === 'plan' && (
          <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 📢 최상단 전광판 안내 및 강조형 시작 버튼 */}
            <div className="bg-slate-900 p-6 rounded-3xl border-2 border-cyan-500 text-center shadow-lg" style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '1.5rem', border: '2px solid #06b6d4', textAlign: 'center' }}>
              <h2 className="text-2xl font-black text-cyan-400 mb-2" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22d3ee', marginBottom: '0.5rem' }}>🎯 작전 계획 수립 프로토콜</h2>
              <p className="text-sm font-bold text-slate-400 mb-4" style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>
                아래 훈련에서 오늘 격파할 <span style={{ color: '#3b82f6', fontWeight: 900 }}>공부 {settings.studyTarget}개</span>와 <span style={{ color: '#f97316', fontWeight: 900 }}>집안일 {settings.houseworkTarget}개</span>를 터치해라!
              </p>
              
              {/* 🚀 최상단에 큼직하게 배치한 메인 시작 버튼 */}
              <button
                type="button"
                onClick={startTodayQuest}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-2xl py-5 rounded-2xl tracking-widest uppercase shadow-xl transition-all"
                style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', border: 'none', background: 'linear-gradient(to right, #22d3ee, #2563eb)', color: '#020617', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(6,182,212,0.5)' }}
              >
                ⚡ 선택 완료! 오늘 작전 개시! ⚡
              </button>
            </div>

            {/* 공부 선택 블록 */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#3b82f6', margin: 0 }}>🧠 오늘 수행할 공부 퀘스트</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#1e3a8a', color: '#93c5fd', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid #1e40af' }}>
                  {missions.filter(m => m.category === 'study' && selectedIds.includes(m.id)).length} / {settings.studyTarget} 선택됨
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {missions.filter(m => m.category === 'study').map(m => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleCardClick(m.id, m.category)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '6rem', padding: '1.25rem', borderRadius: '1rem', border: isSelected ? '2px solid #3b82f6' : '2px solid #1e293b', backgroundColor: isSelected ? '#1e3a8a' : '#0f172a', color: '#ffffff', textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}
                    >
                      <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>{m.text}</span>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '2px solid #475569', display: 'flex', alignItems: 'center', justifycontent: 'center', backgroundColor: isSelected ? '#3b82f6' : 'transparent', color: '#fff' }}>
                        {isSelected && "✓"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 집안일 선택 블록 */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f97316', margin: 0 }}>🏡 오늘 서포트할 집안일</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#7c2d12', color: '#ffedd5', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid #9a3412' }}>
                  {missions.filter(m => m.category === 'housework' && selectedIds.includes(m.id)).length} / {settings.houseworkTarget} 선택됨
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {missions.filter(m => m.category === 'housework').map(m => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleCardClick(m.id, m.category)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '6rem', padding: '1.25rem', borderRadius: '1rem', border: isSelected ? '2px solid #f97316' : '2px solid #1e293b', backgroundColor: isSelected ? '#7c2d12' : '#0f172a', color: '#ffffff', textAlign: 'left', cursor: 'pointer', boxSizing: 'border-box' }}
                    >
                      <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>{m.text}</span>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', border: '2px solid #475569', display: 'flex', alignItems: 'center', justifycontent: 'center', backgroundColor: isSelected ? '#f97316' : 'transparent', color: '#fff' }}>
                        {isSelected && "✓"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ==========================================
            [PHASE 2] 작전 실행 화면 (미션 체크 모드)
            ========================================== */}
        {currentPhase === 'action' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>⚡ 실시간 미션 수행 모드</h2>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>완료 시 카드를 터치해라!</p>
                </div>
                <div style={{ backgroundColor: '#020617', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid #1e293b' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{completedCount}</span>
                  <span style={{ color: '#475569', margin: '0 0.5rem' }}>/</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#cbd5e1' }}>{totalCount} 완료</span>
                </div>
              </div>
              <div style={{ width: '100%', backgroundColor: '#020617', height: '1.5rem', borderRadius: '9999px', padding: '0.25rem', border: '1px solid #1e293b', boxSizing: 'border-box', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(to right, #22d3ee, #3b82f6, #10b981)', width: `${progressPercent}%`, transition: 'width 0.4s ease-in-out' }} />
              </div>
            </div>

            {/* 실행용 정렬 바둑판 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {currentActiveMissions.map(m => {
                const isCompleted = completedIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleCardClick(m.id, m.category)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '6rem', padding: '1.25rem', borderRadius: '1rem', border: isCompleted ? '2px solid #10b981' : '2px solid #475569', backgroundColor: isCompleted ? '#064e3b' : '#0f172a', color: '#ffffff', textAlign: 'left', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}
                  >
                    <span style={{ fontSize: '1.125rem', fontWeight: 900, color: isCompleted ? '#a7f3d0' : '#f8fafc' }}>{m.text}</span>
                    <div>
                      {isCompleted ? (
                        <div style={{ backgroundColor: '#10b981', color: '#020617', fontWeight: 900, fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>완료!</div>
                      ) : (
                        <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '9999px', border: '2px solid #475569' }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" onClick={resetTodayQuest} style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.5rem 1.25rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>🔄 작전 초기화</button>
            </div>
          </div>
        )}

        {/* ==========================================
            [PHASE 3] 100원 저금통 화면
            ========================================== */}
        {currentPhase === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '32rem', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#0f172a', border: '4px solid #eab308', borderRadius: '1.5rem', padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#facc15', margin: 0 }}>MISSION ACCOMPLISHED</h2>
              <p style={{ color: '#cbd5e1', marginTop: '0.5rem', fontWeight: 700 }}>오늘의 퀘스트를 격파했습니다!</p>
              
              <div style={{ padding: '2rem 0' }}>
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ fontSize: '6rem' }}>🪙</motion.div>
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', backgroundColor: '#020617', padding: '0.75rem', borderRadius: '1rem', border: '1px solid #1e293b' }}>
                금고 적립 완료: +100 원
              </div>
            </div>

            {/* 15일 보장 현황판 */}
            <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontStyle: 'normal', fontWeight: 900, color: '#eab308', fontSize: '0.875rem' }}>🎖️ 15일 파이널 용돈 보드</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>{coinCount} / 15 격파</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} style={{ aspectRatio: '1/1', borderRadius: '1rem', border: '2px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, backgroundColor: i < coinCount ? '#eab308' : '#020617', color: i < coinCount ? '#020617' : '#475569' }}>
                    {i < coinCount ? '🪙' : i + 1}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button type="button" onClick={() => setCurrentPhase('stats')} style={{ backgroundColor: '#06b6d4', color: '#020617', fontWeight: 900, padding: '1rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', fontSize: '1.125rem' }}>📊 분석하기</button>
              <button type="button" onClick={resetTodayQuest} style={{ backgroundColor: '#334155', color: '#ffffff', fontWeight: 900, padding: '1rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', fontSize: '1.125rem' }}>🔄 다시 시작</button>
            </div>
          </div>
        )}

        {/* ==========================================
            [PHASE 4] 부모님 분석 통계 화면 (Recharts 최적화)
            ========================================== */}
        {currentPhase === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>📊 종합 행동 성취 분석실</h2>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>아동의 누적 행동 리포트입니다.</p>
              </div>
              <button type="button" onClick={exportToCSV} style={{ backgroundColor: '#10b981', color: '#020617', fontWeight: 900, fontSize: '0.75rem', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>💾 일일 분석 기록 CSV 저장</button>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid #334155' }}>
              <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0', uppercase: true }}>📈 최근 일주일 퀘스트 완수 트렌드</h4>
              <div style={{ height: '16rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="완료수" stroke="#06b6d4" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid #334155' }}>
                <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>🍕 분야별 총 격파 누적 기여율</h4>
                <div style={{ height: '12rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                        {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid #334155' }}>
                <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>🏆 다빈도 공부 정복 랭킹 TOP 5</h4>
                <div style={{ height: '12rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="수행횟수" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setCurrentPhase('plan')} style={{ backgroundColor: '#1e293b', color: '#cbd5e1', fontWeight: 900, padding: '1rem', borderRadius: '1rem', border: 'none', cursor: 'pointer' }}>⬅️ 기지 메인 제어판으로 복귀</button>
          </div>
        )}
      </main>

      {/* [MODAL] 상단 ✏️ 에디터 컨트롤 모달 팝업 */}
      <AnimatePresence>
        {isEditorOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,6,23,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ backgroundColor: '#0f172a', width: '100%', maxWidth: '36rem', borderRadius: '1.5rem', border: '2px solid #334155', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontStyle: 'normal', fontSize: '1.25rem', color: '#fff' }}>🛠️ 작전 항목 데이터 커스텀 에디터</h3>
                <button type="button" onClick={() => setIsEditorOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
              </div>

              {/* 목표량 세팅 수정부 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#020617', padding: '1rem', borderRadius: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>공부 목표 (개)</label>
                  <input type="number" min={1} max={12} value={settings.studyTarget} onChange={(e) => setSettings({ ...settings, studyTarget: Number(e.target.value) })} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem', color: '#fff', fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>집안일 목표 (개)</label>
                  <input type="number" min={0} max={5} value={settings.houseworkTarget} onChange={(e) => setSettings({ ...settings, houseworkTarget: Number(e.target.value) })} style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem', color: '#fff', fontWeight: 700 }} />
                </div>
              </div>

              {/* 추가 양식 폼 */}
              <form onSubmit={addMission} style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#020617', padding: '0.5rem', borderRadius: '1rem' }}>
                <select value={newMissionCat} onChange={(e: any) => setNewMissionCat(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem', color: '#fff', fontWeight: 700 }}><option value="essential">필수</option><option value="study">공부</option><option value="housework">집안일</option></select>
                <input type="text" placeholder="미션 이름 입력" value={newMissionText} onChange={(e) => setNewMissionText(e.target.value)} style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem', color: '#fff', fontSize: '0.875rem' }} />
                <button type="submit" style={{ backgroundColor: '#06b6d4', color: '#020617', fontWeight: 900, border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>등록</button>
              </form>

              {/* CRUD 전체 리스트 스크롤 영역 */}
              <div style={{ maxHeight: '14rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {missions.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#020617', padding: '0.5rem 0.75rem', borderRadius: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                      <span style={{ fontSize: '9px', fontWeight: 900, padding: '0.125rem 0.375rem', borderRadius: '0.25rem', backgroundColor: '#1e293b' }}>{m.category === 'essential' ? '필수' : m.category === 'study' ? '공부' : '집안일'}</span>
                      {editingId === m.id ? (
                        <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '0.25rem', borderRadius: '0.25rem', fontSize: '0.75rem', flex: 1 }} />
                      ) : (
                        <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{m.text}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {editingId === m.id ? (
                        <button type="button" onClick={() => saveEdit(m.id)} style={{ color: '#10b981', background: 'none', border: 'none', fontWeight: 900, cursor: 'pointer' }}>✓</button>
                      ) : (
                        <button type="button" onClick={() => { setEditingId(m.id); setEditingText(m.text); }} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                      )}
                      <button type="button" onClick={() => deleteMission(m.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'right', borderTop: '1px solid #1e293b', paddingTop: '0.75rem' }}>
                <button type="button" onClick={() => setIsEditorOpen(false)} style={{ backgroundColor: '#334155', color: '#fff', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>닫기 및 수정 종료</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
