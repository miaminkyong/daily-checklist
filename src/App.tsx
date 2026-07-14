import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, Edit2, Download, X, BarChart2, Calendar, Award } from 'lucide-react';
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
  // 필수 미션
  { id: 'e1', category: 'essential', text: '🤖 바닥 완벽 정리' },
  { id: 'e2', category: 'essential', text: '📚 책상 & 책장 정리' },
  { id: 'e3', category: 'essential', text: '🧪 개인 물병 싱크대 놓기' },
  { id: 'e4', category: 'essential', text: '👕 외출복 정리하기' },
  { id: 'e5', category: 'essential', text: '🪥 치카치카 양치 3분' },
  { id: 'e6', category: 'essential', text: '🧼 세수하고 로션 바르기' },
  { id: 'e7', category: 'essential', text: '🎒 내일 학교가방 챙기기' },
  { id: 'e8', category: 'essential', text: '📐 내일 학원가방 챙기기' },

  // 공부 미션
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

  // 집안일 미션
  { id: 'h1', category: 'housework', text: '☀️ 거실 커튼 정리하기' },
  { id: 'h2', category: 'housework', text: '👟 현관 신발 각 세워 정리' },
  { id: 'h3', category: 'housework', text: '🍽️ 식세기 그릇 정리 돕기' },
];

export default function App() {
  // 상태 관리
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('quest_missions');
    return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
  });

  const [settings, setSettings] = useState({ studyTarget: 4, houseworkTarget: 1 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  
  // 페이즈 관리: 'plan'(계획) | 'action'(실행) | 'success'(성공화면) | 'stats'(전술분석)
  const [currentPhase, setCurrentPhase] = useState<'plan' | 'action' | 'success' | 'stats'>('plan');
  
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [savings, setSavings] = useState<number>(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // 미션 편집 임시 상태
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
      // 초기 상태: 필수는 항상 셋팅
      const essentials = missions.filter(m => m.category === 'essential').map(m => m.id);
      setSelectedIds(essentials);
    }
  }, []);

  const saveTodayState = (active: boolean, selected: string[], completed: string[]) => {
    localStorage.setItem(`quest_active_${todayStr}`, String(active));
    localStorage.setItem(`quest_selected_${todayStr}`, JSON.stringify(selected));
    localStorage.setItem(`quest_completed_${todayStr}`, JSON.stringify(completed));
  };

  // 카드 터치 이벤트
  const handleCardClick = (id: string, category: string) => {
    if (currentPhase === 'plan') {
      // 1. 계획수립 화면에서의 작동
      if (category === 'essential') return; // 필수는 강제 선택 상태
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else if (currentPhase === 'action') {
      // 2. 작전실행 화면에서의 작동
      let newCompleted = [...completedIds];
      if (completedIds.includes(id)) {
        newCompleted = newCompleted.filter(i => i !== id);
      } else {
        newCompleted.push(id);
      }
      setCompletedIds(newCompleted);
      saveTodayState(true, selectedIds, newCompleted);

      // 올 클리어 체크
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

  // 오늘 작전 개시
  const startTodayQuest = () => {
    const selectedStudyCount = missions.filter(m => m.category === 'study' && selectedIds.includes(m.id)).length;
    const selectedHouseworkCount = missions.filter(m => m.category === 'housework' && selectedIds.includes(m.id)).length;

    if (selectedStudyCount !== settings.studyTarget || selectedHouseworkCount !== settings.houseworkTarget) {
      alert(`🚨 공부 미션은 정확히 ${settings.studyTarget}개, 집안일은 ${settings.houseworkTarget}개를 골라야 작전을 시작할 수 있어!`);
      return;
    }

    // 필수 항목을 포함하여 무조건 구성
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

  // 미션 CRUD 관리
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

  // CSV 추출 기능
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

  // 차트 가공용 통계 데이터
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

  // 현재 진행 수치 계산
  const currentActiveMissions = missions.filter(m => selectedIds.includes(m.id));
  const totalCount = currentActiveMissions.length;
  const completedCount = completedIds.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans select-none pb-24 relative">
      {/* 웅장한 사이버 작전실 헤더 */}
      <header className="bg-slate-900 border-b-4 border-cyan-500/40 p-4 sticky top-0 z-40 shadow-2xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setIsEditorOpen(true)}
            className="bg-slate-950 border border-slate-700 hover:border-cyan-400 p-3 rounded-2xl text-cyan-400 shadow-md transition-all active:scale-90"
            title="미션 편집실"
          >
            <Edit2 size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-cyan-400 game-font">DAILY QUEST</h1>
            <p className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase">Combat Controller v2.0</p>
          </div>
        </div>

        {/* 대형 보물창고 */}
        <div className="bg-slate-950 px-5 py-2.5 rounded-2xl border-2 border-yellow-500/50 flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
          <span className="text-3xl animate-bounce">🪙</span>
          <div>
            <div className="text-[10px] text-yellow-500 font-black tracking-widest">COMMANDER GOLD</div>
            <div className="text-xl font-black text-yellow-400">{savings} 원</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-4">
        
        {/* ==========================================
            [PHASE 1] 계획 수립 화면 (공부 4개 + 집안일 1개 지정식)
            ========================================== */}
        {currentPhase === 'plan' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-center shadow-lg">
              <h2 className="text-2xl font-black text-cyan-400 mb-2">🎯 오늘의 비밀 미션 계획 단계</h2>
              <p className="text-sm font-bold text-slate-400">
                아래 훈련 목록에서 오늘 돌파할 <span className="text-blue-400 font-extrabold">공부 {settings.studyTarget}개</span>와 <span className="text-orange-400 font-extrabold">집안일 {settings.houseworkTarget}개</span>를 터치해라!
              </p>
            </div>

            {/* 공부 선택 블록 */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-black text-blue-400 flex items-center gap-2">🧠 오늘 수행할 공부 퀘스트</h3>
                <span className="text-xs font-bold bg-blue-950 text-blue-300 px-3 py-1 rounded-full border border-blue-800">
                  {missions.filter(m => m.category === 'study' && selectedIds.includes(m.id)).length} / {settings.studyTarget} 선택됨
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {missions.filter(m => m.category === 'study').map(m => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleCardClick(m.id, m.category)}
                      className={`h-24 p-5 rounded-2xl flex items-center justify-between text-left transition-all border-2 ${
                        isSelected 
                          ? 'bg-blue-950 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-102 text-white' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-lg font-extrabold">{m.text}</span>
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-300 text-white' : 'border-slate-700'}`}>
                        {isSelected && <Check size={18} strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 집안일 선택 블록 */}
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-black text-orange-400 flex items-center gap-2">🏡 오늘 서포트할 집안일</h3>
                <span className="text-xs font-bold bg-orange-950 text-orange-300 px-3 py-1 rounded-full border border-orange-800">
                  {missions.filter(m => m.category === 'housework' && selectedIds.includes(m.id)).length} / {settings.houseworkTarget} 선택됨
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {missions.filter(m => m.category === 'housework').map(m => {
                  const isSelected = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleCardClick(m.id, m.category)}
                      className={`h-24 p-5 rounded-2xl flex items-center justify-between text-left transition-all border-2 ${
                        isSelected 
                          ? 'bg-orange-950 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-102 text-white' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="text-lg font-extrabold">{m.text}</span>
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-300 text-white' : 'border-slate-700'}`}>
                        {isSelected && <Check size={18} strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 작전 개시 플로팅 버튼 */}
            <div className="pt-6">
              <button
                type="button"
                onClick={startTodayQuest}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-2xl py-6 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.5)] tracking-widest uppercase active:scale-95 transition-all"
              >
                🚀 이 계획으로 오늘 작전 개시!
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            [PHASE 2] 작전 실행 화면 (필수 + 오늘 고른 5개 결합)
            ========================================== */}
        {currentPhase === 'action' && (
          <div className="space-y-6">
            {/* 진행률 상단 전광판 */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-black text-white">⚡ 실시간 미션 수행 모드</h2>
                  <p className="text-xs text-slate-400 font-bold mt-1">완료 시 터치하여 지도를 지워라!</p>
                </div>
                <div className="text-right bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
                  <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
                  <span className="text-slate-500 mx-1.5">/</span>
                  <span className="text-lg font-bold text-slate-300">{totalCount} 격파 완료</span>
                </div>
              </div>
              <div className="w-full bg-slate-950 h-6 rounded-full p-1 border border-slate-800 overflow-hidden">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs text-slate-500 font-bold">SYSTEM INTEGRITY</span>
                <span className="text-sm font-black text-emerald-400">{progressPercent}% SYNC</span>
              </div>
            </div>

            {/* 격파 대상 카드 그리드 (전부 똑같은 크기의 정적 카드로 균일화) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentActiveMissions.map(m => {
                const isCompleted = completedIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleCardClick(m.id, m.category)}
                    className={`h-24 p-5 rounded-2xl flex items-center justify-between text-left transition-all border-2 relative overflow-hidden ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-500 shadow-inner opacity-70 scale-98' 
                        : 'bg-slate-900 border-slate-700 shadow-lg active:scale-95'
                    }`}
                  >
                    {!isCompleted && (
                      <div className={`absolute left-0 top-0 bottom-0 w-2 ${m.category === 'essential' ? 'bg-emerald-500' : m.category === 'study' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                    )}
                    <span className={`text-lg font-black tracking-wide pl-2 ${isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {m.text}
                    </span>
                    <div>
                      {isCompleted ? (
                        <div className="bg-emerald-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-[0_0_10px_rgba(16,185,129,0.4)] flex items-center gap-1">
                          <Check size={14} strokeWidth={4} /> 완료!
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-slate-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 작전 변경용 리셋 긴급 탈출 */}
            <div className="text-center pt-4">
              <button 
                type="button" 
                onClick={resetTodayQuest}
                className="text-xs font-black text-red-400 bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 px-5 py-2.5 rounded-xl"
              >
                🔄 작전 계획 다시 짜기
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            [PHASE 3] 100원 골드 적립 축하 저금통 화면
            ========================================== */}
        {currentPhase === 'success' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="bg-slate-900 border-4 border-yellow-500 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(234,179,8,0.3)]">
              <div className="text-7xl mb-4 animate-bounce">🏆</div>
              <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest game-font">MISSION ACCOMPLISHED</h2>
              <p className="text-lg font-bold text-slate-300 mt-2">오늘의 작전을 완벽하게 격파했습니다!</p>
              
              {/* 날아가는 동전 연출 */}
              <div className="py-8 relative flex justify-center items-center">
                <motion.div 
                  initial={{ scale: 0.1, y: 100 }}
                  animate={{ scale: [1, 2, 1], y: [-50, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-8xl"
                >
                  🪙
                </motion.div>
              </div>

              <div className="text-2xl font-black text-white bg-slate-950 py-3 rounded-2xl border border-slate-800">
                금고 입금: +100 원 완료!
              </div>
            </div>

            {/* 15일 챌린지 시각판 */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest">🎖️ 15일 보물상자 전장판</h3>
                <span className="text-xs font-bold text-slate-400">{coinCount} / 15 격파</span>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                      i < coinCount 
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-300 text-slate-950 shadow-[0_0_12px_rgba(234,179,8,0.4)] scale-105' 
                        : 'bg-slate-950 border-slate-800 text-slate-700'
                    }`}
                  >
                    {i < coinCount ? '🪙' : i + 1}
                  </div>
                ))}
              </div>
              {coinCount >= 15 && (
                <div className="mt-4 p-4 bg-yellow-500/10 rounded-2xl border-2 border-yellow-500/30 text-center text-sm font-black text-yellow-400">
                  🎉 전설 달성! 사령관(부모님)께 1500원 용돈 현금 보상을 수령하세요! 🎉
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCurrentPhase('stats')}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-lg py-4 rounded-2xl shadow-lg transition-all"
              >
                📊 전술 분석 일지 열기
              </button>
              <button
                type="button"
                onClick={resetTodayQuest}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-lg py-4 rounded-2xl border border-slate-700 transition-all"
              >
                🔄 새로운 작전 시작
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            [PHASE 4] 전술 분석 화면 (그래프 및 일일 CSV 추출)
            ========================================== */}
        {currentPhase === 'stats' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">📊 패널 전술 분석 기지</h2>
                <p className="text-xs text-slate-400 font-bold mt-1">지금까지 축적된 작전 데이터입니다.</p>
              </div>
              <button 
                type="button"
                onClick={exportToCSV}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              >
                <Download size={14} /> 일일 CSV 분석 다운로드
              </button>
            </div>

            {/* 시계열 선 그래프 */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">📈 주별/일별 작전 성공 추이</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData.length > 0 ? lineData : [{name: '데이터없음', 완료수: 0}]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Line type="monotone" dataKey="완료수" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 파이 원형 그래프 */}
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">🍕 분야별 공헌 지수</h4>
                <div className="h-44 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value"
                      >
                        {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-around text-xs font-bold text-slate-400 mt-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>필수</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>공부</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>집안일</span>
                </div>
              </div>

              {/* 공부 누적 막대 그래프 */}
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">🏆 가장 많이 정복한 공부 TOP 5</h4>
                {barData.length > 0 ? (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                        <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                        <Bar dataKey="수행횟수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center py-12 text-xs text-slate-500">통계가 유입되면 해금됩니다.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPhase('plan')}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-black py-4 rounded-2xl"
            >
              ⬅️ 메인 대시보드로 복귀
            </button>
          </div>
        )}
      </main>

      {/* ==========================================
          [MODAL EDITOR] 상단 연필 버튼을 누르면 팝업되는 설정 패널
          ========================================== */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-slate-900 w-full max-w-2xl rounded-3xl border-2 border-slate-800 p-6 space-y-6 shadow-2xl relative"
            >
              {/* 모달 닫기 */}
              <button 
                type="button" 
                onClick={() => setIsEditorOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-2xl font-black text-white flex items-center gap-2">🛠️ 미션 통제 센터</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">할 일 목록을 추가, 삭제하거나 목표 수량을 조정합니다.</p>
              </div>

              {/* 목표 선택 세팅 수량 조절 */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">하루 공부 목표량 (개)</label>
                  <input 
                    type="number" min={1} max={12}
                    value={settings.studyTarget}
                    onChange={(e) => setSettings({ ...settings, studyTarget: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 font-black text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">하루 집안일 목표량 (개)</label>
                  <input 
                    type="number" min={0} max={5}
                    value={settings.houseworkTarget}
                    onChange={(e) => setSettings({ ...settings, houseworkTarget: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 font-black text-white outline-none"
                  />
                </div>
              </div>

              {/* 새로운 미션 추가 양식 */}
              <form onSubmit={addMission} className="flex flex-col sm:flex-row gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <select 
                  value={newMissionCat}
                  onChange={(e: any) => setNewMissionCat(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-bold text-sm text-slate-300"
                >
                  <option value="essential">🟢 필수</option>
                  <option value="study">🔵 공부</option>
                  <option value="housework">🟠 집안일</option>
                </select>
                <input 
                  type="text"
                  placeholder="예: 🎹 피아노 연습 20분"
                  value={newMissionText}
                  onChange={(e) => setNewMissionText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none"
                />
                <button 
                  type="submit" 
                  className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-sm px-6 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Plus size={16} /> 등록
                </button>
              </form>

              {/* 등록 리스트 목록 편집창 */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {missions.map(m => (
                  <div key={m.id} className="bg-slate-950 p-3 rounded-xl border border-slate-950 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${m.category === 'essential' ? 'bg-emerald-950 text-emerald-400' : m.category === 'study' ? 'bg-blue-950 text-blue-400' : 'bg-orange-950 text-orange-400'}`}>
                        {m.category === 'essential' ? '필수' : m.category === 'study' ? '공부' : '집안일'}
                      </span>
                      {editingId === m.id ? (
                        <input 
                          type="text" 
                          value={editingText} 
                          onChange={(e) => setEditingText(e.target.value)} 
                          className="bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1 text-xs font-bold flex-1"
                        />
                      ) : (
                        <span className="text-sm font-extrabold text-slate-300">{m.text}</span>
                      )}
                    </div>
                    
                    <div className="flex gap-1.5">
                      {editingId === m.id ? (
                        <button type="button" onClick={() => saveEdit(m.id)} className="text-xs font-black text-emerald-400 hover:bg-slate-900 px-2 py-1 rounded">✓</button>
                      ) : (
                        <button type="button" onClick={() => { setEditingId(m.id); setEditingText(m.text); }} className="text-slate-400 hover:text-white"><Edit2 size={14} /></button>
                      )}
                      <button type="button" onClick={() => deleteMission(m.id)} className="text-red-400 hover:bg-red-950/20 p-1 rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right border-t border-slate-800 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditorOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-black px-6 py-2.5 rounded-xl text-sm"
                >
                  ⚙️ 닫기 및 반영
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
