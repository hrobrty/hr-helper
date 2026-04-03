import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  UserPlus, 
  Upload, 
  Trash2, 
  Play, 
  RotateCcw, 
  Settings2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { Person, TabType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [names, setNames] = useState<Person[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Lucky Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<Person | null>(null);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [drawnIds, setDrawnIds] = useState<Set<string>>(new Set());
  const [displayWinner, setDisplayWinner] = useState<string>('');
  
  // Grouping State
  const [groupSize, setGroupSize] = useState(3);
  const [groups, setGroups] = useState<Person[][]>([]);

  // Handle CSV Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const parsedNames: Person[] = results.data
          .flat()
          .filter((name: any) => typeof name === 'string' && name.trim() !== '')
          .map((name: any, index) => ({
            id: `csv-${Date.now()}-${index}`,
            name: name.trim()
          }));
        
        setNames(prev => [...prev, ...parsedNames]);
      },
      header: false
    });
  };

  // Handle Text Paste
  const handleAddNames = () => {
    const newNames = inputText
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n !== '')
      .map((name, index) => ({
        id: `text-${Date.now()}-${index}`,
        name
      }));
    
    setNames(prev => [...prev, ...newNames]);
    setInputText('');
  };

  const loadMockData = () => {
    const mockNames = [
      '陳大文', '林小明', '張美玲', '李志豪', '王曉華', 
      '趙子龍', '孫悟空', '周杰倫', '蔡依林', '劉德華',
      '林小明', '張美玲' // Intentional duplicates for demo
    ].map((name, index) => ({
      id: `mock-${Date.now()}-${index}`,
      name
    }));
    setNames(mockNames);
  };

  const removeDuplicates = () => {
    const seen = new Set();
    const uniqueNames = names.filter(person => {
      const isDuplicate = seen.has(person.name);
      seen.add(person.name);
      return !isDuplicate;
    });
    setNames(uniqueNames);
  };

  const getDuplicateNames = () => {
    const counts: Record<string, number> = {};
    names.forEach(n => {
      counts[n.name] = (counts[n.name] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter(name => counts[name] > 1));
  };

  const duplicateNames = getDuplicateNames();

  const clearNames = () => {
    setNames([]);
    setDrawnIds(new Set());
    setWinner(null);
    setGroups([]);
  };

  // Lucky Draw Logic
  const startDraw = () => {
    const availablePool = allowDuplicates 
      ? names 
      : names.filter(n => !drawnIds.has(n.id));

    if (availablePool.length === 0) {
      alert('沒有可抽取的名單了！');
      return;
    }

    setIsDrawing(true);
    setWinner(null);

    let counter = 0;
    const duration = 3000;
    const interval = 80;
    const steps = duration / interval;

    const timer = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availablePool.length);
      setDisplayWinner(availablePool[randomIndex].name);
      counter++;

      if (counter >= steps) {
        clearInterval(timer);
        const finalWinner = availablePool[Math.floor(Math.random() * availablePool.length)];
        setWinner(finalWinner);
        setIsDrawing(false);
        if (!allowDuplicates) {
          setDrawnIds(prev => new Set(prev).add(finalWinner.id));
        }
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        });
      }
    }, interval);
  };

  // Grouping Logic
  const generateGroups = () => {
    if (names.length === 0) return;
    
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const result: Person[][] = [];
    
    for (let i = 0; i < shuffled.length; i += groupSize) {
      result.push(shuffled.slice(i, i + groupSize));
    }
    
    setGroups(result);
  };

  const downloadGroupsCSV = () => {
    if (groups.length === 0) return;

    const csvData = groups.flatMap((group, index) => 
      group.map(person => ({
        '組別': `第 ${index + 1} 組`,
        '姓名': person.name
      }))
    );

    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `分組結果_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Users className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">HR 抽獎與分組工具</h1>
            <p className="text-xs text-slate-500">快速管理名單、抽獎與自動分組</p>
          </div>
        </div>
        
        <nav className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('input')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'input' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Upload size={16} /> 名單匯入
          </button>
          <button 
            onClick={() => setActiveTab('draw')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'draw' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Trophy size={16} /> 獎品抽獎
          </button>
          <button 
            onClick={() => setActiveTab('group')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'group' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            <UserPlus size={16} /> 自動分組
          </button>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {/* Input Tab */}
          {activeTab === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="text-blue-500" /> 匯入名單
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                      <p className="text-sm text-slate-600">點擊或拖拽上傳 CSV 檔案</p>
                      <p className="text-xs text-slate-400 mt-1">僅支援單欄姓名格式</p>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-400">或直接貼上姓名</span>
                      </div>
                    </div>

                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="每行一個姓名，或用逗號分隔..."
                      className="w-full h-32 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm"
                    />
                    
                    <button 
                      onClick={handleAddNames}
                      disabled={!inputText.trim()}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      新增至名單
                    </button>

                    <button 
                      onClick={loadMockData}
                      className="w-full bg-slate-100 text-slate-600 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> 載入模擬名單
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="text-blue-500" /> 目前名單 ({names.length})
                    </h2>
                    <div className="flex items-center gap-2">
                      {duplicateNames.size > 0 && (
                        <button 
                          onClick={removeDuplicates}
                          className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-200 transition-colors font-bold flex items-center gap-1"
                          title="移除所有重複姓名"
                        >
                          <Trash2 size={12} /> 移除重複
                        </button>
                      )}
                      {names.length > 0 && (
                        <button 
                          onClick={clearNames}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          title="清除所有名單"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-2">
                    {names.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                        <AlertCircle size={48} className="mb-2 opacity-20" />
                        <p>尚未匯入任何名單</p>
                      </div>
                    ) : (
                      names.map((person, idx) => {
                        const isDuplicate = duplicateNames.has(person.name);
                        return (
                          <div 
                            key={person.id} 
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl border transition-colors",
                              isDuplicate 
                                ? "bg-amber-50 border-amber-200" 
                                : "bg-slate-50 border-slate-100"
                            )}
                          >
                            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                              <span className="text-slate-400">{idx + 1}.</span>
                              {person.name}
                              {isDuplicate && (
                                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">
                                  重複
                                </span>
                              )}
                            </span>
                            <button 
                              onClick={() => setNames(names.filter(n => n.id !== person.id))}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lucky Draw Tab */}
          {activeTab === 'draw' && (
            <motion.div 
              key="draw"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 space-y-8"
            >
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl w-full max-w-2xl text-center space-y-8 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50" />

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900">幸運大抽獎</h2>
                  <p className="text-slate-500">點擊按鈕開始隨機抽取幸運兒</p>
                </div>

                <div className="h-48 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 relative">
                  <AnimatePresence mode="wait">
                    {isDrawing ? (
                      <motion.div 
                        key="drawing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-5xl font-black text-blue-600 tracking-wider"
                      >
                        {displayWinner}
                      </motion.div>
                    ) : winner ? (
                      <motion.div 
                        key="winner"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        >
                          <Trophy size={48} className="text-amber-500 mb-4" />
                        </motion.div>
                        <span className="text-6xl font-black text-slate-900">{winner.name}</span>
                        <span className="mt-2 text-blue-600 font-semibold uppercase tracking-widest text-sm">恭喜中獎！</span>
                      </motion.div>
                    ) : (
                      <div className="text-slate-300 text-lg font-medium">準備就緒</div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-8 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Settings2 size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">設定：</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        onClick={() => setAllowDuplicates(!allowDuplicates)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          allowDuplicates ? "bg-blue-600" : "bg-slate-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          allowDuplicates ? "left-6" : "left-1"
                        )} />
                      </div>
                      <span className="text-sm text-slate-600 group-hover:text-slate-900">允許重複中獎</span>
                    </label>
                    <div className="text-sm text-slate-400">
                      剩餘可抽：<span className="text-blue-600 font-bold">{names.length - (allowDuplicates ? 0 : drawnIds.size)}</span> 人
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={startDraw}
                      disabled={isDrawing || names.length === 0}
                      className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all flex items-center gap-3"
                    >
                      {isDrawing ? "抽取中..." : winner ? "再抽一次" : "開始抽獎"}
                      {!isDrawing && <Play size={20} fill="currentColor" />}
                    </button>
                    
                    {winner && (
                      <button 
                        onClick={() => { setWinner(null); setDrawnIds(new Set()); }}
                        className="bg-white text-slate-600 border border-slate-200 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
                      >
                        <RotateCcw size={20} /> 重置
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grouping Tab */}
          {activeTab === 'group' && (
            <motion.div 
              key="group"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">分組人數</label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setGroupSize(Math.max(2, groupSize - 1))}
                        className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold w-12 text-center">{groupSize}</span>
                      <button 
                        onClick={() => setGroupSize(groupSize + 1)}
                        className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-10 w-px bg-slate-200 hidden md:block" />

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">預計組數</p>
                    <p className="text-2xl font-bold text-slate-900">{Math.ceil(names.length / groupSize)} 組</p>
                  </div>
                </div>

                <button 
                  onClick={generateGroups}
                  disabled={names.length === 0}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-blue-100"
                >
                  <UserPlus size={20} /> 開始自動分組
                </button>

                {groups.length > 0 && (
                  <button 
                    onClick={downloadGroupsCSV}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md shadow-emerald-100"
                  >
                    <Download size={20} /> 下載分組結果
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">設定分組人數並點擊按鈕開始</p>
                  </div>
                ) : (
                  groups.map((group, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-700">第 {idx + 1} 組</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">
                          {group.length} 人
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        {group.map((person) => (
                          <div key={person.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                              {person.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{person.name}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-green-500" /> 系統就緒
          </span>
          <span>|</span>
          <span>總人數: {names.length}</span>
        </div>
        <div>
          &copy; 2024 HR 抽獎與分組工具
        </div>
      </footer>
    </div>
  );
}
