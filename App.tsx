import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CURRICULUM } from './constants';
import { Question, AllStats } from './types';
import { generateQuestions } from './services/geminiService';
import Loader from './components/Loader';
import QuestionCard from './components/QuestionCard';
import StatsDashboard from './components/StatsDashboard';

const App: React.FC = () => {
  const STATS_STORAGE_KEY = 'quizAppStats';

  const [selectedSubject, setSelectedSubject] = useState<string>(Object.keys(CURRICULUM)[0]);
  const [selectedUnit, setSelectedUnit] = useState<string>(CURRICULUM[Object.keys(CURRICULUM)[0]][0]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('Orta');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AllStats>(() => {
    try {
      const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
      return savedStats ? JSON.parse(savedStats) : {};
    } catch (error) {
      console.error("Failed to load stats from localStorage", error);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error("Failed to save stats to localStorage", error);
    }
  }, [stats]);

  const availableUnits = useMemo(() => {
    return CURRICULUM[selectedSubject] || [];
  }, [selectedSubject]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubject = e.target.value;
    setSelectedSubject(newSubject);
    setSelectedUnit(CURRICULUM[newSubject][0]);
    setGeneratedQuestions([]);
    setError(null);
  };

  const handleFormSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSubject || !selectedUnit || questionCount < 1) {
      setError("Lütfen geçerli bir ders, ünite ve soru sayısı seçin.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedQuestions([]);

    try {
      const questions = await generateQuestions(selectedSubject, selectedUnit, questionCount, difficulty);
      setGeneratedQuestions(questions);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject, selectedUnit, questionCount, difficulty]);

  const handleAnswerSubmit = useCallback((isCorrect: boolean) => {
    setStats(prevStats => {
        const newStats = { ...prevStats };
        const subjectStats = newStats[selectedSubject] || { total: 0, correct: 0, incorrect: 0, score: 0 };
        
        subjectStats.total += 1;
        if (isCorrect) {
            subjectStats.correct += 1;
            subjectStats.score += 5;
        } else {
            subjectStats.incorrect += 1;
        }
        
        newStats[selectedSubject] = subjectStats;
        return newStats;
    });
  }, [selectedSubject]);

  const handleResetStats = () => {
    if (window.confirm("Tüm ilerlemeniz silinecek. Emin misiniz?")) {
        // Explicitly remove from storage to ensure the change is persisted immediately.
        localStorage.removeItem(STATS_STORAGE_KEY);
        // Update state to re-render the UI.
        setStats({});
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            <span className="text-cyan-600">AI</span> Destekli Soru Bankası
            <span className="text-sm font-normal text-gray-500 ml-2">8. Sınıf</span>
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {Object.keys(stats).length > 0 && (
          <StatsDashboard stats={stats} onReset={handleResetStats} />
        )}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-1">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Ders Seçin</label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={handleSubjectChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              >
                {Object.keys(CURRICULUM).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Ünite Seçin</label>
              <select
                id="unit"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              >
                {availableUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Zorluk</label>
                <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                >
                    <option value="Kolay">Kolay</option>
                    <option value="Orta">Orta</option>
                    <option value="Zor">Zor</option>
                </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-1">Soru Sayısı</label>
              <input
                type="number"
                id="count"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                min="1"
                max="10"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full p-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:bg-cyan-300 transition-colors flex items-center justify-center"
              >
                {isLoading ? 'Üretiliyor...' : 'Soru Üret'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-6" role="alert">
            <p className="font-bold">Hata</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading && <Loader />}
        
        {generatedQuestions.length > 0 && (
          <div className="space-y-6">
            {generatedQuestions.map((q, i) => (
              <QuestionCard 
                key={`${selectedSubject}-${selectedUnit}-${i}`} 
                question={q} 
                index={i}
                onAnswerSubmit={handleAnswerSubmit}
              />
            ))}
          </div>
        )}

        {!isLoading && generatedQuestions.length === 0 && !error && (
            <div className="text-center py-16 px-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700">Başlamaya Hazır Mısınız?</h2>
                <p className="text-gray-500 mt-2">Yukarıdan ders ve ünite seçimi yaparak yapay zeka ile sorularınızı oluşturun.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;