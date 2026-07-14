import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Plus, Trash2, Edit2, Download, BarChart2, Calendar, 
  Settings, Award, Flame, Database, CheckCircle2, Circle, X
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import confetti from 'canvas-confetti';

// ==========================================
// 1. 타입 정의 및 초기 데이터 인터페이스
// ==========================================
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
  // 필수 미션 (자동 선택)
  { id: 'e1', category: 'essential', text: '🤖 바닥 완벽 정리' },
  { id: 'e2', category: 'essential', text: '📚 책상 & 책장 정리' },
  { id: 'e3', category: 'essential', text: '🧪 개인 물병 싱크대에 놓기' },
  { id: 'e4', category: 'essential', text: '👕 외출복 정리 및 빨래통에 넣기' },
  { id: 'e5', category: 'essential', text: '🪥 치카치카 양치질 3분' },
  { id: 'e6', category: 'essential', text: '🧼 깨끗하게 세수 + 로션 바르기' },
  { id: 'e7', category: 'essential', text: '🎒 내일 학교 가방 미리 챙기기' },
  { id: 'e8', category: 'essential', text: '📐 내일 학원 가방 미리 챙기기' },

  // 공부 퀘스트
  { id: 's1', category: 'study', text: '🧮 연산 마스터 3페이지' },
  { id: 's2', category: 'study', text: '📐 수학 교재 숙제 완수' },
  { id: 's3', category: 'study', text: '🧠 사고력 수학 최고난도 문제' },
  { id: 's4', category: 'study', text: '📺 CMS 복습 영상 시청 완료' },
  { id: 's5', category: 'study', text: '🇬🇧 영어 문법 유닛 정복' },
  { id: 's6', category: 'study', text: '✍️ 스토리가 있는 세 줄 쓰기' },
  { id: 's7', category: 'study', text: '📰 어린이 키즈 신문 정독' },
  { id: 's8', category: 'study', text: '🧪 영어 과학 탐구 읽기' },
  { id: 's9', category: 'study', text: '🌅 아침 눈뜨자마자 영어 필사' },
  { id: 's10', category: 'study', text: '📓 오답 노트를 겸한 수학 일기' },
  { id: 's11', category: 'study', text: '📝 영어 학원 과제 올 클리어' },
  { id: 's12', category: 'study', text: '🎯 필수 영단어 암기 퀘스트' },

  // 집안일 지원
  { id: 'h1', category: 'housework', text: '☀️ 거실 커튼 예쁘게 걷기/치우기' },
  { id: 'h2', category: 'housework', text: '👟 현관 신발 각 잡아 정리하기' },
  { id: 'h3', category: 'housework', text: '🍽️ 식기세척기 마른 그릇 정리 돕기' },
];

export default function App() {
  // ==========================================
  // 2. 상태 관리 (State)
  // ==========================================
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('quest_missions');
    return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
  });

  const [settings, setSettings] = useState({
    studyTarget: 4,
    houseworkTarget: 1,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isQuestActive, setIsQuestActive] = useState(false);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  
  // 골드 및 챌린지 상태
  const [savings, setSavings] = useState<number>(0);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'quest' | 'stats' | 'manage'>('quest');

  // 관리용 상태
  const [newMissionText, setNewMissionText] = useState('');
  const [newMissionCat, setNewMissionCat] = useState<'essential' | 'study' | 'housework'>('study');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // ==========================================
  // 3. 초기화 및 로컬스토리지 동기화
  // ==========================================
  useEffect(() => {
    localStorage.setItem('quest_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('quest_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedSavings = localStorage.getItem('quest_savings');
    if (savedSavings) setSavings(Number(savedSavings));

    // 오늘 이미 진행중인 퀘스트가 있는지 확인
    const savedActive = localStorage.getItem(`quest_active_${todayStr}`);
    const savedSelected = localStorage.getItem(`quest_selected_${todayStr}`);
    const savedCompleted = localStorage.getItem(`quest_completed_${todayStr}`);

    if (savedActive === 'true') {
      setIsQuestActive(true);
      if (savedSelected) setSelectedIds(JSON.parse(savedSelected));
      if (savedCompleted) setCompletedIds(JSON.parse(savedCompleted));
    } else {
      // 초기화 시 필수는 무조건 자동 선택 상태로 세팅
      const essentials = missions.filter(m => m.category === 'essential').map(m => m.id);
      setSelectedIds(essentials);
    }
  }, []);

  // 오늘 상태 저장 유틸리티
  const saveTodayState = (active: boolean, selected: string[], completed: string[]) => {
    localStorage.setItem(`quest_active_${todayStr}`, String(active));
    localStorage.setItem(`quest_selected_${todayStr}`, JSON.stringify(selected));
    localStorage.setItem(`quest_completed_${todayStr}`, JSON.stringify(completed));
  };

  // ==========================================
  // 4. 핵심 비즈니스 로직
  // ==========================================
  const handleCardClick = (id: string, category: string) => {
    if (category === 'essential' && !isQuestActive) return; // 필수는 대기중엔 해제불가

    if (!isQuestActive) {
      // 1단계: 계획 수립 단계 (선택/해제)
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      // 2단계: 퀘스트 수행 단계 (완료/취소)
      let newCompleted = [...completedIds];
      if (completedIds.includes(id)) {
        newCompleted = newCompleted.filter(i => i !== id);
      } else {
        newCompleted.push(id);
      }
      setCompletedIds(newCompleted);
      saveTodayState(true, selectedIds, newCompleted);

      // 100% 달성 체크
      if (newCompleted.length === selectedIds.length && selectedIds.length > 0) {
        triggerSuccess();
      }
    }
  };

  // 100% 성공 연출 및 보상 지급
  const triggerSuccess = () => {
    // 1. 폭죽 팡파레
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    
    // 2. 코인 애니메이션 구동 및 용돈 적립 (기존 오늘 이미 받았는지 체크 로직 포함 가능)
    setShowCoinAnimation(true);
    const newSavings = savings + 100;
    setSavings(newSavings);
    localStorage.setItem('quest_savings', String(newSavings));

    // 3. 기록 업데이트 및 저장
    const currentMissions = missions.filter(m => selectedIds.includes(m.id));
    const newRecords: DailyRecord[] = currentMissions.map(m => ({
      date: todayStr,
      missionId: m.id,
      category: m.category,
      text: m.text,
      selected: true,
      completed: true
    }));

    // 중복 제거 후 히스토리 누적
    setHistory(prev => {
      const filtered = prev.filter(h => h.date !== todayStr);
      const updated = [...filtered, ...newRecords];
      localStorage.setItem('quest_history', JSON.stringify(updated));
      return updated;
    });

    setTimeout(() => setShowCoinAnimation(false), 3000);
  };

  // 오늘 작전 개시 버튼 클릭
  const startTodayQuest = () => {
    setIsQuestActive(true);
    saveTodayState(true, selectedIds, []);
  };

  // 퀘스트 리셋 (하루 리셋 및 재계획용)
  const resetTodayQuest = () => {
    if (window.confirm("🚨 오늘 퀘스트를 리셋하고 다시 계획할까?")) {
      setIsQuestActive(false);
      setCompletedIds([]);
      const essentials = missions.filter(m => m.category === 'essential').map(m => m.id);
      setSelectedIds(essentials);
      saveTodayState(false, essentials, []);
    }
  };

  // ==========================================
  // 5. 항목 추가/수정/삭제 관리 기능
  // ==========================================
  const addMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionText.trim()) return;
    const newId = 'custom_' + Date.now();
    const newObj: Mission = { id: newId, category: newMissionCat, text: newMissionText, isCustom: true };
    setMissions([...missions, newObj]);
    setNewMissionText('');
    if (newMissionCat === 'essential') setSelectedIds([...selectedIds, newId]);
  };

  const deleteMission = (id: string) => {
    if (window.confirm("🗑️ 이 미션을 영구 삭제할까?")) {
      setMissions(missions.filter(m => m.id !== id));
      setSelectedIds(selectedIds.filter(i => i !== id));
      setCompletedIds(completedIds.filter(i => i !== id));
    }
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const saveEdit = (id: string) => {
    setMissions(missions.map(m => m.id === id ? { ...m, text: editingText } : m));
    setEditingId(null);
  };

  // ==========================================
  // 6. CSV 다운로드 기능
  // ==========================================
  const exportToCSV = () => {
    if (history.length === 0) {
      alert("📦 아직 축적된 데이터가 없습니다.");
      return;
    }
    let csvContent = "\uFEFF날짜,카테고리,항목,선택,완료\n";
    history.forEach(r => {
      csvContent += `${r.date},${r.category === 'essential' ? '필수' : r.category === 'study' ? '공부' : '집안일'},${r.text.replace(/,/g, '')},O,${r.completed ? 'O' : 'X'}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `데일리퀘스트_학습기록_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // 7. 통계 가공 데이터 생성
  // ==========================================
  const getChartData = () => {
    const dates = Array.from(new Set(history.map(h => h.date))).sort().slice(-7);
    const lineData = dates.map(d => {
      const dayLogs = history.filter(h => h.date === d);
      const comp = dayLogs.filter(h => h.completed).length;
      const total = dayLogs.length;
      return { name: d.slice(5), 완료율: total > 0 ? Math.round((comp / total) * 100) : 0 };
    });

    const categories = { essential: 0, study: 0, housework: 0 };
    history.filter(h => h.completed).forEach(h => { if (categories[h.category] !== undefined) categories[h.category]++; });
    const pieData = [
      { name: '필수', value: categories.essential, color: '#10B981' },
      { name: '공부', value: categories.study, color: '#3B82F6' },
      { name: '집안일', value: categories.housework, color: '#F97316' },
    ];

    const studyCounts: { [key: string]: number } = {};
    history.filter(h => h.category === 'study' && h.completed).forEach(h => { studyCounts[h.text] = (studyCounts[h.text] || 0) + 1; });
    const barData = Object.keys(studyCounts).map(k => ({ name: k.substring(2, 8), 횟수: studyCounts[k] })).slice(0, 5);

    return { lineData, pieData, barData };
  };

  const { lineData, pieData, barData } = getChartData();

  // 연속 성공일 계산 및 코인 판 수 계산 (15일 만점 기준)
  const totalCompletedDays = Array.from(new Set(history.filter(h => h.completed).map(h => h.date))).length;
  const coinCount = Math.min(15, Math.floor(savings / 100));

  // 진행률 연산
  const totalCount = selectedIds.length;
  const completedCount = completedIds.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 카테고리별 분할 리스트
  const essentialMissions = missions.filter(m => m.category === 'essential');
  const studyMissions = missions.filter(m => m.category === 'study');
  const houseworkMissions = missions.filter(m => m.category === 'housework');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans select-none pb-24">
      {/* 글로벌 헤더 */}
      <header className="bg-slate-900 border-b-2 border-cyan-500/30 p-4 sticky top-0 z-40 shadow-[0_4px_20px_rgba(6,182,212,0.15)]">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                MY DAILY QUEST
              </h1>
              <p className="text-xs text-slate-400 font-bold">OPERATOR DASHBOARD</p>
            </div>
          </div>
          
          {/* 특수 보상 금고 UI */}
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-yellow-500/50 flex items-center gap-3 shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]">
            <span className="text-2xl animate-pulse">🪙</span>
            <div>
              <div className="text-xs text-yellow-500 font-black">COMMANDER CASH</div>
              <div className="text-lg font-black text-yellow-400">{savings} 원</div>
            </div>
          </div>
        </div>
      </header>

      {/* 실시간 플로팅 코인 획득 애니메이션 */}
      <AnimatePresence>
        {showCoinAnimation && (
          <motion.div 
            initial={{ scale: 0.2, y: 300, opacity: 0 }}
            animate={{ scale: [1, 1.5, 1], y: -100, opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="fixed inset-0 m-auto w-72 h-72 z-50 flex flex-col items-center justify-center bg-slate-900/90 rounded-3xl border-4 border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.6)]"
          >
            <motion.div animate={{ rotateY: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-7xl mb-4">🪙</motion.div>
            <h2 className="text-2xl font-black text-yellow-400 text-center uppercase tracking-wider">미션 올클리어!</h2>
            <p className="text-3xl font-black text-white mt-2">+100 GOLD</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto p-4 mt-2">
        {/* 네비게이션 탭 버튼 그룹 */}
        <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('quest')}
            className={`py-3 px-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'quest' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ⚔️ 작전 수행
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'stats' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            📊 전술 분석
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`py-3 px-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'manage' ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}
          >
            ⚙️ 퀘스트 편집
          </button>
        </div>

        {/* ==========================================
            TAB 1: 퀘스트 수행 화면
            ========================================== */}
        {activeTab === 'quest' && (
          <div>
            {/* 진행상황 전광판 대시보드 */}
            <div className="bg-slate-900 rounded-3xl p-6 border-2 border-slate-800 mb-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <div className="text-xs text-cyan-400 font-bold tracking-widest mb-1">CURRENT STATUS</div>
                  <h2 className="text-2xl font-black flex items-center gap-2 text-white">
                    🚀 오늘의 특별 미션 디스플레이
                  </h2>
                </div>
                <div className="text-right bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                  <span className="text-xl font-black text-cyan-400">{completedCount}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-lg font-bold text-slate-300">{totalCount} 완료</span>
                </div>
              </div>

              {/* 하이테크 네온 인디케이터 바 */}
              <div className="w-full bg-slate-950 h-6 rounded-full overflow-hidden p-1 border border-slate-800">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "spring", stiffness: 60 }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs text-slate-500 font-bold">SYSTEM ACTIVE</span>
                <span className="text-sm font-black text-emerald-400 tracking-wider">{progressPercent}% SYNC</span>
              </div>
            </div>

            {/* 15일 보상 챌린지 도장판 스탠드 */}
            <div className="bg-slate-900 rounded-3xl p-5 border border-yellow-600/30 mb-8 shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black text-yellow-500 tracking-wider uppercase flex items-center gap-2">
                  🏆 15일 파이널 드래곤 보상 챌린지
                </h3>
                <span className="text-xs text-slate-400 font-bold">{coinCount} / 15 완료</span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-2">
                {Array.from({ length: 15 }).map((_, index) => (
                  <div 
                    key={index} 
                    className={`aspect-square rounded-xl border flex items-center justify-center text-xl font-bold transition-all ${
                      index < coinCount 
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-300 text-slate-950 shadow-[0_0_10px_rgba(234,179,8,0.4)] scale-105' 
                        : 'bg-slate-950 border-slate-800 text-slate-700'
                    }`}
                  >
                    {index < coinCount ? '🪙' : index + 1}
                  </div>
                ))}
              </div>
              {coinCount >= 15 && (
                <div className="mt-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-center text-xs font-black text-yellow-400 animate-bounce">
                  🎉 전설의 15일 마스터 완료! 부모님께 1500원 최종 보상을 요청하세요! 🎉
                </div>
              )}
            </div>

            {/* 작전 준비 / 리셋 모드 스위치 컨트롤 */}
            {!isQuestActive ? (
              <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-2xl p-4 border border-cyan-500/40 flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <p className="text-sm font-medium text-cyan-200">
                  ⚡ 공부(최소 <span className="font-bold text-white">{settings.studyTarget}개</span>), 집안일(최소 <span className="font-bold text-white">{settings.houseworkTarget}개</span>) 미션을 선택하고 시작버튼을 누르세요!
                </p>
                <button 
                  onClick={startTodayQuest}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg px-8 py-3.5 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] tracking-widest uppercase transition-all"
                >
                  🚀 오늘 퀘스트 개시!
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <p className="text-xs font-bold text-emerald-400 tracking-wider">미션 수행 페이즈 실시간 작동 중...</p>
                </div>
                <button 
                  onClick={resetTodayQuest}
                  className="text-xs font-black text-red-400 bg-red-950/40 border border-red-900/60 px-3 py-1.5 rounded-lg hover:bg-red-900/40"
                >
                  🔄 미션 재배치
                </button>
              </div>
            )}

            {/* 카테고리 1: 필수 작전 항목 */}
            <section className="mb-8">
              <h3 className="text-base font-black text-emerald-400 mb-3 tracking-widest flex items-center gap-2 uppercase">
                <span className="w-2 h-4 bg-emerald-500 rounded-sm"></span> 필수 미션 (매일 고정 수행)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {essentialMissions.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  const isCompleted = completedIds.includes(m.id);
                  return (
                    <MissionCard 
                      key={m.id} m={m} isSelected={isSelected} isCompleted={isCompleted} 
                      isQuestActive={isQuestActive} onClick={() => handleCardClick(m.id, m.category)} 
                    />
                  );
                })}
              </div>
            </section>

            {/* 카테고리 2: 공부 강화 훈련 */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-black text-blue-400 tracking-widest flex items-center gap-2 uppercase">
                  <span className="w-2 h-4 bg-blue-500 rounded-sm"></span> 공부 브레인 퀘스트
                </h3>
                <span className="text-xs font-bold text-slate-500">목표: {settings.studyTarget}개 선택</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studyMissions.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  const isCompleted = completedIds.includes(m.id);
                  if (isQuestActive && !isSelected) return null; // 실행모드에서는 선택안된 카드 자동 블라인드 숨김
                  return (
                    <MissionCard 
                      key={m.id} m={m} isSelected={isSelected} isCompleted={isCompleted} 
                      isQuestActive={isQuestActive} onClick={() => handleCardClick(m.id, m.category)} 
                    />
                  );
                })}
              </div>
            </section>

            {/* 카테고리 3: 집안일 서포트 기여 */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-black text-orange-400 tracking-widest flex items-center gap-2 uppercase">
                  <span className="w-2 h-4 bg-orange-500 rounded-sm"></span> 디펜스 집안일 서포트
                </h3>
                <span className="text-xs font-bold text-slate-500">목표: {settings.houseworkTarget}개 선택</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {houseworkMissions.map((m) => {
                  const isSelected = selectedIds.includes(m.id);
                  const isCompleted = completedIds.includes(m.id);
                  if (isQuestActive && !isSelected) return null;
                  return (
                    <MissionCard 
                      key={m.id} m={m} isSelected={isSelected} isCompleted={isCompleted} 
                      isQuestActive={isQuestActive} onClick={() => handleCardClick(m.id, m.category)} 
                    />
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ==========================================
            TAB 2: 분석 통계 화면 (리차트 연동)
            ========================================== */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* 상단 요약 배지 패널 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 text-2xl">🔥</div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">누적 작전 수행 기록</div>
                  <div className="text-lg font-black text-white">{totalCompletedDays} 일 완료 돌파</div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 text-2xl">⚡</div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">총 격파 미션 수</div>
                  <div className="text-lg font-black text-white">{history.filter(h => h.completed).length}개 서포트</div>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between col-span-1 sm:col-span-1">
                <button 
                  onClick={exportToCSV}
                  className="w-full h-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-slate-300 py-3"
                >
                  <Download size={16} /> 백업용 CSV 추출하기
                </button>
              </div>
            </div>

            {/* 메인 분석 그래프 차트 그룹 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">📈 최근 일주일 성취 그래프</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData.length > 0 ? lineData : [{name: '데이터없음', 완료율: 0}]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                      <Line type="monotone" dataKey="완료율" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col justify-between">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">🍕 클래스 카테고리 기여율</h4>
                <div className="h-48 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData.some(d => d.value > 0) ? pieData : [{name: '미완료', value: 1, color: '#334155'}]} 
                        cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value"
                      >
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
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
            </div>

            {/* 트레이닝 빈도 톱 리스트 */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">🏆 공부 퀘스트 집중 격파 빈도 (TOP 5)</h4>
              {barData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Bar dataKey="횟수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-10 text-xs text-slate-500">완료된 공부 퀘스트 데이터가 누적되면 그래프가 해금됩니다.</p>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: 시스템 편집 및 퀘스트 에디터 내부 관리자
            ========================================== */}
        {activeTab === 'manage' && (
          <div className="space-y-8">
            {/* 설정 타깃 구성 제어판 */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <h4 className="text-sm font-black text-slate-300 tracking-wider mb-4">🛠️ 일일 목표 강도 커스텀 세팅</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">하루 공부 퀘스트 필수 타깃 개수</label>
                  <input 
                    type="number" min={1} max={12}
                    value={settings.studyTarget}
                    onChange={(e) => setSettings({ ...settings, studyTarget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 font-bold text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">하루 집안일 기여 목표 타깃 개수</label>
                  <input 
                    type="number" min={0} max={5}
                    value={settings.houseworkTarget}
                    onChange={(e) => setSettings({ ...settings, houseworkTarget: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 font-bold text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 새 퀘스트 아이템 인스톨 폼 */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <h4 className="text-sm font-black text-slate-300 tracking-wider mb-4">➕ 전장에 새로운 커스텀 퀘스트 추가</h4>
              <form onSubmit={addMission} className="flex flex-col sm:flex-row gap-3">
                <select 
                  value={newMissionCat}
                  onChange={(e: any) => setNewMissionCat(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 font-bold text-sm text-slate-300 outline-none"
                >
                  <option value="essential">🟢 필수 미션</option>
                  <option value="study">🔵 공부 퀘스트</option>
                  <option value="housework">🟠 집안일 기여</option>
                </select>
                <input 
                  type="text"
                  placeholder="예: 🎹 피아노 명곡 연습 20분"
                  value={newMissionText}
                  onChange={(e) => setNewMissionText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 font-bold text-white placeholder-slate-600 outline-none"
                />
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 font-black px-6 py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all">
                  <Plus size={18} /> 추가하기
                </button>
              </form>
            </div>

            {/* 전체 인스톨 데이터 전수 모니터링 및 실시간 CRUD 수정판 */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800">
              <h4 className="text-sm font-black text-slate-300 tracking-wider mb-4">📋 현재 등록 관리 중인 전체 데이터베이스 검사</h4>
              <div className="space-y-3">
                {missions.map(m => (
                  <div key={m.id} className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`text-xs px-2 py-1 rounded-md font-black ${m.category === 'essential' ? 'bg-emerald-950 text-emerald-400' : m.category === 'study' ? 'bg-blue-950 text-blue-400' : 'bg-orange-950 text-orange-400'}`}>
                        {m.category === 'essential' ? '필수' : m.category === 'study' ? '공부' : '집안일'}
                      </span>
                      {editingId === m.id ? (
                        <input 
                          type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-sm font-bold flex-1"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-200">{m.text}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {editingId === m.id ? (
                        <button onClick={() => saveEdit(m.id)} className="p-1.5 text-emerald-400 hover:bg-slate-900 rounded-lg">✓</button>
                      ) : (
                        <button onClick={() => startEdit(m.id, m.text)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg"><Edit2 size={14} /></button>
                      )}
                      <button onClick={() => deleteMission(m.id)} className="p-1.5 text-red-400 hover:bg-red-950/30 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// 8. 서브 컴포넌트: 전술 미션 전용 카드 모듈
// ==========================================
interface CardProps {
  m: Mission;
  isSelected: boolean;
  isCompleted: boolean;
  isQuestActive: boolean;
  onClick: () => void;
}

function MissionCard({ m, isSelected, isCompleted, isQuestActive, onClick }: CardProps) {
  // 상태 조합별 네온 스타일 클래스 팩토리 가동
  let cardStyle = "bg-slate-900 border-2 border-slate-800 shadow-md hover:border-slate-700";
  
  if (!isQuestActive) {
    // 계획 세우기 단계
    if (isSelected) {
      cardStyle = "bg-slate-900 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-[1.01]";
    }
  } else {
    // 퀘스트 파이터 수행 단계
    if (isCompleted) {
      cardStyle = "bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500 shadow-inner scale-[0.98] opacity-75";
    } else {
      cardStyle = "bg-slate-900 border-2 border-slate-700 shadow-lg active:scale-95";
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full p-5 rounded-2xl flex items-center justify-between text-left transition-all relative overflow-hidden h-20 ${cardStyle}`}
    >
      <div className="flex items-center gap-4">
        {/* 체크 상태가 아닐 때 카테고리 컬러 바 인디케이터 부여 */}
        {!isCompleted && (
          <div className={`absolute left-0 top-0 bottom-0 w-2 ${m.category === 'essential' ? 'bg-emerald-500' : m.category === 'study' ? 'bg-blue-500' : 'bg-orange-500'}`} />
        )}
        
        <div className="flex flex-col">
          <span className={`text-base font-black tracking-wide ${isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
            {m.text}
          </span>
          {!isQuestActive && m.category === 'essential' && (
            <span className="text-[10px] font-black text-emerald-400 mt-0.5 uppercase">AUTO LOCKED</span>
          )}
        </div>
      </div>

      {/* 완료 상태 플래그 그래픽 스위치 */}
      <div>
        {isQuestActive ? (
          isCompleted ? (
            <div className="flex items-center gap-1 bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-[0_0_10px_rgba(16,185,129,0.4)]">
              <Check size={14} strokeWidth={4} /> 완료!
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center">
              <span className="w-2.5 h-2.5 bg-transparent rounded-full" />
            </div>
          )
        ) : (
          /* 계획 선택 단계 체크 서클 */
          <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-700'}`}>
            {isSelected && <Check size={14} strokeWidth={4} />}
          </div>
        )}
      </div>
    </motion.button>
  );
}
