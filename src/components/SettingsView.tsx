import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { cn } from '../lib/utils';
import { Moon, Volume2, PartyPopper, Save, Sun, Clock, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
    const { settings, updateSettings } = useTaskStore();
    const [localSettings, setLocalSettings] = useState(settings);
    const [isSaved, setIsSaved] = useState(false);

    // Sync local state if store updates from elsewhere (unlikely but good practice)
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        updateSettings(localSettings);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleChange = (key: keyof typeof settings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        setIsSaved(false);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto animate-fade-in pb-20">
            <h1 className="text-3xl font-bold text-text-primary mb-8 uppercase tracking-tight">System Configuration</h1>

            <div className="space-y-8">
                {/* Planning Section */}
                <div className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Clock size={16} /> Planning Hours
                    </h2>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Start of Day</label>
                            <div className="relative">
                                <select
                                    value={localSettings.startOfDay}
                                    onChange={(e) => handleChange('startOfDay', parseInt(e.target.value))}
                                    className="w-full bg-background border border-border rounded p-2 text-text-primary font-mono focus:border-primary-500 focus:outline-none appearance-none cursor-pointer"
                                >
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <option key={i} value={i} className="bg-surface">
                                            {i.toString().padStart(2, '0')}:00
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                    <Clock size={14} />
                                </div>
                            </div>
                            <p className="mt-1 text-[10px] text-text-muted">Tasks before this hour will be greyed out.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">End of Day</label>
                            <div className="relative">
                                <select
                                    value={localSettings.endOfDay}
                                    onChange={(e) => handleChange('endOfDay', parseInt(e.target.value))}
                                    className="w-full bg-background border border-border rounded p-2 text-text-primary font-mono focus:border-primary-500 focus:outline-none appearance-none cursor-pointer"
                                >
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <option key={i} value={i} className="bg-surface">
                                            {i.toString().padStart(2, '0')}:00
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                    <Clock size={14} />
                                </div>
                            </div>
                            <p className="mt-1 text-[10px] text-text-muted">Tasks after this hour will be greyed out.</p>
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-6">Preferences</h2>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Appearance</h3>

                        <div className="flex items-center justify-between">
                            <label className="text-text-primary text-sm">Theme Mode</label>
                            <div className="flex bg-background border border-border rounded p-1">
                                <button
                                    onClick={() => handleChange('isDarkMode', false)}
                                    className={cn("p-1.5 rounded", !localSettings.isDarkMode ? "bg-surface shadow text-primary-500" : "text-text-muted")}
                                >
                                    <Sun size={16} />
                                </button>
                                <button
                                    onClick={() => handleChange('isDarkMode', true)}
                                    className={cn("p-1.5 rounded", localSettings.isDarkMode ? "bg-surface shadow text-primary-500" : "text-text-muted")}
                                >
                                    <Moon size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-text-primary text-sm flex justify-between">
                                <span>Block Highlight Color</span>
                                <span className="text-xs text-text-muted uppercase">{localSettings.blockColor || 'Neutral'}</span>
                            </label>
                            <div className="flex gap-2">
                                {['neutral', 'blue', 'green', 'purple', 'rose'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleChange('blockColor', color)}
                                        className={cn(
                                            "w-6 h-6 rounded-full border border-border transition-all",
                                            localSettings.blockColor === color ? "ring-2 ring-primary-500 scale-110" : "hover:scale-110 opacity-70",
                                            color === 'neutral' && "bg-gray-500",
                                            color === 'blue' && "bg-blue-500",
                                            color === 'green' && "bg-green-500",
                                            color === 'purple' && "bg-purple-500",
                                            color === 'rose' && "bg-rose-500"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-text-primary text-sm flex justify-between">
                                <span>Block Opacity</span>
                                <span className="text-xs text-text-muted">{Math.round((localSettings.blockOpacity || 0.1) * 100)}%</span>
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="50"
                                step="5"
                                value={(localSettings.blockOpacity || 0.1) * 100}
                                onChange={(e) => handleChange('blockOpacity', parseInt(e.target.value) / 100)}
                                className="w-full accent-primary-500 h-1 bg-surface rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between p-2 hover:bg-surface/50 rounded transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-full text-text-secondary">
                                    <Volume2 size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-text-primary">Sound Effects</div>
                                    <div className="text-xs text-text-muted">Play sounds on timer completion</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleChange('enableSound', !localSettings.enableSound)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.enableSound ? 'bg-primary-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${localSettings.enableSound ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-2 hover:bg-surface/50 rounded transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-full text-text-secondary">
                                    <PartyPopper size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-text-primary">Confetti</div>
                                    <div className="text-xs text-text-muted">Celebration on task completion</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleChange('enableConfetti', !localSettings.enableConfetti)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${localSettings.enableConfetti ? 'bg-primary-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${localSettings.enableConfetti ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Handler */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        className={`
                            px-6 py-2 rounded font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all
                            ${isSaved
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20'}
                        `}
                    >
                        {isSaved ? <Check size={16} /> : <Save size={16} />}
                        {isSaved ? 'Settings Saved' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};
