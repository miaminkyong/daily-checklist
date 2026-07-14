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
  { id: 's3', category: 'study', text: '🧠 사고력 수학 문제 풀기' },
  { id: 's4', category: 'study', text: '📺 CMS 복습 영상 시청 완료' },
  { id: 's5', category: 'study', text: '🇬🇧 영어 문법 유닛 정복' },
  { id: 's6', category: 'study', text: '✍️ 스토리가 있는 세 줄 쓰기' },
  { id: 's7', category: 'study', text: '📰 어린이 키즈 신문 정독' },
  { id: 's8', category: 'study', text: '🧪 영어 과학 탐구 읽기' },
  { id: 's9', category: 'study', text: '🌅 아침 영어 필사 수행' },
  { id: 's10', category: 'study', text: '📓 수학 일기 작성' },
  { id: 's11', category: 'study', text: '📝 영어 학원 과제 클리어' },
  { id: 's12', category: 'study', text: '🎯 필수 영단어 암기 퀘스트' },

  // 집안일 지원
  { id: 'h1', category: 'housework', text: '☀️ 거실 커튼 예쁘게 걷기' },
  { id: 'h2', category: 'housework', text: '👟 현관 신발 각 잡아 정리하기' },
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
  const [isQuestActive, setIsQuestActive] = useState(false);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [savings, setSavings] = useState<number>(0);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'quest' | 'stats' | 'manage'>('quest');

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
      setIsQuestActive(true);
      if (savedSelected) setSelectedIds(JSON.parse(savedSelected));
      if (savedCompleted) setCompletedIds(JSON.parse(savedCompleted));
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
    if (category === 'essential' && !isQuestActive) return;

    if (!isQuestActive) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
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
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    setShowCoinAnimation(true);
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

    setTimeout(() => setShowCoinAnimation(false), 3000);
  };

  const startTodayQuest = () => {
    setIsQuestActive(true);
    saveTodayState(true, selectedIds, []);
  };

  const resetTodayQuest = () => {
    if (window.confirm("🚨 오늘 퀘스트를 리셋하고 다시 계획할까요?")) {
      setIsQuestActive(false);
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
    if (newMissionCat === 'essential') setSelectedIds([...selectedIds, newId]);
  };

  const deleteMission = (id: string) => {
    if (window.confirm("🗑️ 이 미션을 영구 삭제할까요?")) {
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

  const exportToCSV = () => {
    if (history.length === 0) {
      alert("📦 아직 저장된 데이터 기록이 없습니다.");
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
  const coinCount = Math.min(15, Math.floor(savings / 100));
  const totalCount = selectedIds.length;
  const completedCount = completedIds.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans select-none pb-24">
      <header className="bg-slate-900 border-b-2 border-cyan-500/30 p-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 game-font">
              MY DAILY QUEST
            </h1>
            <p className="text-[10px] text-cyan-400 font-bold tracking-widest">TACTICAL SYSTEM v1.4</p>
          </div>
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-yellow-500/40 flex items-center gap-2">
            <span className="text-2xl animate-pulse">🪙</span>
            <div>
              <div className="text-[10px] text-yellow-500 font-black">보물 금고</div>
              <div className="text-base font-black text-yellow-400">{savings} 원</div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showCoinAnimation && (
          <motion.div 
            initial={{ scale: 0.3, y: 200, opacity: 0 }}
            animate={{ scale: [1, 1.4, 1], y: 0, opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5 }}
            className="fixed inset-0 m-auto w-64 h-64 z-50 flex flex-col items-center justify-center bg-slate-900/95 rounded-3xl border-4 border-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.5)]"
          >
            <motion.div animate={{ rotateY: 360 }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-7xl mb-2">🪙</motion.div>
            <h2 className="text-xl font-black text-yellow-400 uppercase tracking-wider">퀘스트 완료!</h2>
            <p className="text-2xl font-black text-white mt-1">+100원 적립!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto p-4 mt-2">
        <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button onClick={() => setActiveTab('quest')} className={`py-2.5 rounded-lg font-black text-xs transition-all ${activeTab === 'quest' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>⚔️ 작전 시작</button>
          <button onClick={() => setActiveTab('stats')} className={`py-2.5 rounded-lg font-black text-xs transition-all ${activeTab === 'stats' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>📊 기록 분석</button>
          <button onClick={() => setActiveTab('manage')} className={`py-2.5 rounded-lg font-black text-xs transition-all ${activeTab === 'manage' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>⚙️ 미션 편집</button>
        </div>

        {activeTab === 'quest' && (
          <div>
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-black tracking-wide text-white">🚀 오늘의 도전 과제</h2>
                <div className="text-xs font-bold text-cyan-400 bg-slate-950 px-3 py-1 rounded-md">
                  {completedCount} / {totalCount} 격파
                </div>
              </div>
              <div className="w-full bg-slate-950 h-5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} />
              </div>
              <div className="text-right text-xs font-bold text-emerald-400 mt-1.5">{progressPercent}% 완료됨</div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 border border-yellow-600/20 mb-6">
              <div className="text-xs font-black text-yellow-500 mb-2 uppercase tracking-wider">🏆 15일 용돈 정복 챌린지</div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-1.5">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className={`aspect-square rounded-lg border flex items-center justify-center text-sm font-black ${i < coinCount ? 'bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-300 text-slate-950 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-700'}`}>
                    {i < coinCount ? '🪙' : i + 1}
                  </div>
                ))}
              </div>
            </div>

            {!isQuestActive ? (
              <div className="bg-slate-900 rounded-xl p-4 border border-cyan-500/30 flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
                <p className="text-xs font-bold text-slate-300">💡 오늘 격파할 공부와 집안일 퀘스트를 누른 뒤 시작 버튼을 터치하세요!</p>
                <button onClick={startTodayQuest} className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm px-6 py-2.5 rounded-lg transition-all shadow-md tracking-wider">🚀 작전 시작!</button>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>작전 수행 상태 돌입</span>
                <button onClick={resetTodayQuest} className="text-[10px] font-bold text-red-400 bg-red-950/30 px-2.5 py-1 rounded border border-red-900/50">🔄 리셋</button>
              </div>
            )}

            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-black text-emerald-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">🟢 필수 장착 미션</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {missions.filter(m => m.category === 'essential').map(m => (
                    <Card key={m.id} m={m} isSelected={selectedIds.includes(m.id)} isCompleted={completedIds.includes(m.id)} isQuestActive={isQuestActive} onClick={() => handleCardClick(m.id, m.category)} />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-blue-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">🔵 공부 격파 과제 (목표: {settings.studyTarget}개)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {missions.filter(m => m.category === 'study').map(m => {
                    if (isQuestActive && !selectedIds.includes(m.id)) return null;
                    return <Card key={m.id} m={m} isSelected={selectedIds.includes(m.id)} isCompleted={completedIds.includes(m.id)} isQuestActive={isQuestActive} onClick={() => handleCardClick(m.id, m.category)} />;
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-orange-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">🟠 집안일 지원 과제 (목표: {settings.houseworkTarget}개)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {missions.filter(m => m.category === 'housework').map(m => {
                    if (isQuestActive && !selectedIds.includes(m.id)) return null;
                    return <Card key={m.id} m={m} isSelected={selectedIds.includes(m.id)} isCompleted={completedIds.includes(m.id)} isQuestActive={isQuestActive} onClick={() => handleCardClick(m.id, m.category)} />;
                  })}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><div className="text-[10px] text-slate-400 font-bold">누적 성공</div><div className="text-base font-black text-white">{coinCount}일 성공</div></div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><div className="text-[10px] text-slate-400 font-bold">완료한 총 퀘스트</div><div className="text-base font-black text-white">{history.filter(h => h.completed).length}개</div></div>
              <button onClick={exportToCSV} className="col-span-2 sm:col-span-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 text-slate-300 py-4"><Download size={14} /> CSV 저장</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📈 일주일 성취도 분석</h4>
                <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={lineData.length > 0 ? lineData : [{name: '데이터없음', 완료율: 0}]}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="name" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="완료율" stroke="#06b6d4" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">🍕 분야별 미션 완료 비율</h4>
                <div className="h-36"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData.some(d => d.value > 0) ? pieData : [{name: '미완료', value: 1, color: '#334155'}]} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">{pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
                <div className="flex justify-around text-[10px] font-bold text-slate-400"><span className="text-emerald-400">필수</span><span className="text-blue-400">공부</span><span className="text-orange-400">집안일</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-black text-slate-200 mb-3">🛠️ 하루 목표 개수 설정</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-slate-400 block mb-1">공부 목표</label><input type="number" value={settings.studyTarget} onChange={(e) => setSettings({ ...settings, studyTarget: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-bold text-white outline-none" /></div>
                <div><label className="text-[10px] text-slate-400 block mb-1">집안일 목표</label><input type="number" value={settings.houseworkTarget} onChange={(e) => setSettings({ ...settings, houseworkTarget: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-bold text-white outline-none" /></div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-black text-slate-200 mb-3">➕ 신규 작전 추가</h4>
              <form onSubmit={addMission} className="flex gap-2">
                <select value={newMissionCat} onChange={(e: any) => setNewMissionCat(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs font-bold text-slate-300 outline-none"><option value="essential">필수</option><option value="study">공부</option><option value="housework">집안일</option></select>
                <input type="text" placeholder="예: 🎹 피아노 연습 20분" value={newMissionText} onChange={(e) => setNewMissionText(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white outline-none" />
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-xs font-black px-4 rounded-lg flex items-center gap-1 transition-all"><Plus size={14} /> 추가</button>
              </form>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-black text-slate-200 mb-3">📋 전체 데이터 리스트 편집</h4>
              <div className="space-y-2">
                {missions.map(m => (
                  <div key={m.id} className="bg-slate-950 p-2 rounded-lg border border-slate-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${m.category === 'essential' ? 'bg-emerald-950 text-emerald-400' : m.category === 'study' ? 'bg-blue-950 text-blue-400' : 'bg-orange-950 text-orange-400'}`}>{m.category === 'essential' ? '필수' : m.category === 'study' ? '공부' : '집안일'}</span>
                      {editingId === m.id ? <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 text-xs font-bold flex-1" /> : <span className="text-xs font-bold text-slate-300">{m.text}</span>}
                    </div>
                    <div className="flex gap-1">
                      {editingId === m.id ? <button onClick={() => saveEdit(m.id)} className="text-xs font-bold text-emerald-400 px-1">✓</button> : <button onClick={() => startEdit(m.id, m.text)} className="text-slate-500 hover:text-white p-1"><Edit2 size={12} /></button>}
                      <button onClick={() => deleteMission(m.id)} className="text-red-400 hover:bg-red-950/20 p-1 rounded"><Trash2 size={12} /></button>
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

function Card({ m, isSelected, isCompleted, isQuestActive, onClick }: { m: Mission; isSelected: boolean; isCompleted: boolean; isQuestActive: boolean; onClick: () => void }) {
  let cardStyle = "bg-slate-900 border border-slate-800 shadow-md";
  if (!isQuestActive) {
    if (isSelected) cardStyle = "bg-slate-900 border-2 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]";
  } else {
    if (isCompleted) cardStyle = "bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500 opacity-60";
    else cardStyle = "bg-slate-900 border-2 border-slate-700 active:scale-98";
  }

  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} className={`w-full p-4 rounded-xl flex items-center justify-between text-left transition-all relative overflow-hidden h-16 ${cardStyle}`}>
      <div className="flex items-center gap-3">
        {!isCompleted && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${m.category === 'essential' ? 'bg-emerald-500' : m.category === 'study' ? 'bg-blue-500' : 'bg-orange-500'}`} />}
        <span className={`text-sm font-bold tracking-wide ${isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>{m.text}</span>
      </div>
      <div>
        {isQuestActive ? (
          isCompleted ? <div className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-1 rounded-md flex items-center gap-0.5 shadow-md"><Check size={10} strokeWidth={4} />완료</div> : <div className="w-5 h-5 rounded-full border border-slate-600" />
        ) : (
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-700'}`}>{isSelected && <Check size={12} strokeWidth={4} />}</div>
        )}
      </div>
    </motion.button>
  );
}
