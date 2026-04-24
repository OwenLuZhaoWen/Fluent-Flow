import React, { useState } from 'react';
import { useLiveAPI } from './hooks/useLiveAPI';
import { SetupOptions, Language, Scenario } from './lib/gemini-prompts';
import { Mic, MicOff, Settings, Volume2, Languages, User, Globe2 } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const LANGUAGES: Language[] = ['Spanish', 'French', 'Japanese', 'German', 'Italian', 'Mandarin', 'English'];
const SCENARIOS: Scenario[] = ['Casual Chat', 'Coffee Shop', 'Job Interview', 'At the Airport', 'Lost in the City'];
const PROFICIENCIES = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function App() {
  const { isConnected, isSpeaking, connect, disconnect } = useLiveAPI();
  const [options, setOptions] = useState<SetupOptions>({
    language: 'Spanish',
    scenario: 'Casual Chat',
    userProficiency: 'Beginner'
  });

  if (isConnected) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-lg flex flex-col items-center justify-between h-[600px] relative overflow-hidden">
          {/* Header */}
          <div className="text-center mt-4">
            <h2 className="text-xl font-medium text-gray-800">{options.language} Practice</h2>
            <p className="text-sm text-gray-500 mt-1">{options.scenario} • {options.userProficiency}</p>
          </div>

          {/* Visualization Ring */}
          <div className="relative w-64 h-64 flex items-center justify-center my-10">
            {/* Pulsing rings */}
            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.2, 1] : [1, 1.05, 1],
                opacity: isSpeaking ? [0.2, 0.4, 0.2] : [0.1, 0.15, 0.1]
              }}
              transition={{
                duration: isSpeaking ? 1.5 : 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn(
                "absolute inset-0 rounded-full bg-blue-500",
                isSpeaking ? "bg-blue-500" : "bg-gray-400"
              )}
            />
            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.4, 1] : [1, 1.1, 1],
                opacity: isSpeaking ? [0.1, 0.2, 0.1] : 0
              }}
              transition={{
                duration: isSpeaking ? 1.5 : 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              className="absolute inset-0 rounded-full bg-blue-500"
            />
            
            {/* Center Avatar/Icon */}
            <div className={cn(
              "relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-md transition-colors duration-500",
              isSpeaking ? "bg-blue-600 text-white shadow-blue-500/50" : "bg-gray-800 text-white shadow-gray-500/30"
            )}>
              {isSpeaking ? <Volume2 size={40} /> : <Mic size={40} />}
            </div>
          </div>

          {/* Status Tracker */}
          <div className="mb-8 h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={isSpeaking ? 'speaking' : 'listening'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-gray-500 text-sm font-medium tracking-wide uppercase"
              >
                {isSpeaking ? "Partner is speaking..." : "Listening..."}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <button
            onClick={disconnect}
            className="group relative w-16 h-16 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm mb-4 border border-red-100"
          >
            <MicOff className="text-red-500 w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-lg">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Globe2 size={32} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Fluent Flow</h1>
          <p className="text-sm text-gray-500 mt-2">Practice with a live AI partner.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Languages size={14} /> Language
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.slice(0, 4).map(lang => (
                <button
                  key={lang}
                  onClick={() => setOptions({ ...options, language: lang })}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border text-left",
                    options.language === lang 
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm" 
                      : "border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-gray-50"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
            {/* Dropdown for the rest to keep UI clean */}
            <select 
               className="w-full mt-2 p-3 rounded-xl border border-gray-200 text-sm text-gray-600 bg-transparent outline-none focus:border-blue-500 appearance-none"
               value={options.language}
               onChange={(e) => setOptions({ ...options, language: e.target.value as Language })}
            >
              {!LANGUAGES.slice(0, 4).includes(options.language) && <option value={options.language}>{options.language}</option>}
              {LANGUAGES.slice(4).map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Settings size={14} /> Scenario
            </label>
            <select
              title="Scenario"
              value={options.scenario}
              onChange={(e) => setOptions({ ...options, scenario: e.target.value as Scenario })}
              className="w-full p-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 bg-transparent appearance-none"
            >
              {SCENARIOS.map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <User size={14} /> Your Level
            </label>
            <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
              {PROFICIENCIES.map(prof => (
                <button
                  key={prof}
                  onClick={() => setOptions({ ...options, userProficiency: prof })}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                    options.userProficiency === prof 
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {prof}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => connect(options)}
          className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <Mic size={18} />
          Start Conversation
        </button>
      </div>
    </div>
  );
}
