import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { X, Calendar, Clock, CheckCircle2, Trash2, Paperclip, File as FileIcon, Download, AlertCircle, Image as ImageIcon, FileText, Music, Video, Code, FileDigit } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (Warning: LocalStorage might be full)

const getFileIcon = (type: string, name: string) => {
    const lowerName = name.toLowerCase();
    if (type.startsWith('image/') || lowerName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return <ImageIcon size={16} />;
    if (type.startsWith('audio/') || lowerName.match(/\.(mp3|wav|ogg|m4a)$/)) return <Music size={16} />;
    if (type.startsWith('video/') || lowerName.match(/\.(mp4|webm|mov|avi)$/)) return <Video size={16} />;
    if (type.includes('pdf') || lowerName.endsWith('.pdf')) return <FileText size={16} />;
    if (
        type.includes('json') || type.includes('javascript') || type.includes('typescript') || type.includes('html') || type.includes('css') ||
        lowerName.match(/\.(json|js|ts|tsx|jsx|html|css|py|rb|php)$/)
    ) return <Code size={16} />;
    if (
        type.includes('spreadsheet') || type.includes('excel') || type.includes('csv') ||
        lowerName.match(/\.(xlsx|xls|csv|ods|numbers)$/)
    ) return <FileDigit size={16} />;
    return <FileIcon size={16} />;
};

export const TaskDetailPanel: React.FC = () => {
    const {
        tasks,
        selectedTaskId,
        selectTask,
        updateTaskContent,
        toggleTask,
        deleteTask,
        addAttachment,
        deleteAttachment
    } = useTaskStore();

    const task = tasks.find(t => t.id === selectedTaskId);
    const [content, setContent] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (task) {
            setContent(task.content || '');
        }
    }, [task?.id]);

    // Auto-save content on change (debounced could be better, but simple onBlur or effect for now)
    // For simplicity/perf, let's update store on Blur or with a slight delay if typing heavily.
    // Given local storage, frequent updates are fine.
    useEffect(() => {
        if (task && content !== task.content) {
            const timer = setTimeout(() => {
                updateTaskContent(task.id, content);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [content, task, updateTaskContent]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        if (!task) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                setError(`File "${file.name}" exceeds 10MB limit.`);
                continue;
            }

            try {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                addAttachment(task.id, {
                    id: uuidv4(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64,
                    createdAt: Date.now()
                });
            } catch (err) {
                console.error("Failed to read file", err);
                setError("Failed to process file.");
            }
        }
    };

    if (!task) return null;

    return (
        <div
            className={cn(
                "h-full flex flex-col bg-surface border-l border-border w-[400px] shadow-2xl z-20 transition-colors relative",
                isDragging && "bg-primary-500/5 ring-2 ring-inset ring-primary-500"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 bg-primary-500/10 backdrop-blur-[1px] z-50 flex items-center justify-center pointer-events-none">
                    <div className="bg-surface p-4 rounded-lg shadow-xl shadow-primary-500/20 border-2 border-primary-500 border-dashed animate-bounce">
                        <Paperclip size={32} className="text-primary-500 mx-auto mb-2" />
                        <span className="font-bold text-primary-500">Drop files to attach</span>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => toggleTask(task.id)}
                        className={cn(
                            "text-text-muted hover:text-primary-400 transition-colors",
                            task.isCompleted && "text-primary-400"
                        )}
                    >
                        <CheckCircle2 size={20} className={cn(task.isCompleted && "fill-primary-500/10")} />
                    </button>
                    <div className="text-xs font-bold uppercase tracking-wider text-text-muted">Task Details</div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this task?')) {
                                deleteTask(task.id);
                                selectTask(null);
                            }
                        }}
                        className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors"
                        title="Delete Task"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button
                        onClick={() => selectTask(null)}
                        className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content Scroller */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-6">
                    {/* Title */}
                    <div className="text-xl font-bold text-text-primary leading-tight">
                        {task.title}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase text-text-muted">Date</span>
                            <div className="flex items-center gap-2 text-sm text-text-primary h-8">
                                <Calendar size={14} className="text-text-muted" />
                                {task.plannedDate ? format(new Date(task.plannedDate), 'MMM d, yyyy') : <span className="text-text-muted italic text-xs">Unplanned</span>}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase text-text-muted">Time</span>
                            <div className="flex items-center gap-2 text-sm text-text-primary h-8">
                                <Clock size={14} className="text-text-muted" />
                                {task.plannedTime || <span className="text-text-muted italic text-xs">Any time</span>}
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-border/50" />

                    {/* Attachments Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-text-muted flex items-center gap-2">
                                <Paperclip size={10} />
                                Attachments ({task.attachments?.length || 0})
                            </span>
                            {error && (
                                <span className="text-[10px] text-red-500 flex items-center gap-1 animate-pulse">
                                    <AlertCircle size={10} /> {error}
                                </span>
                            )}
                        </div>

                        {task.attachments && task.attachments.length > 0 ? (
                            <div className="grid gap-2">
                                {task.attachments.map(att => (
                                    <div
                                        key={att.id}
                                        onClick={() => {
                                            const win = window.open();
                                            if (win) {
                                                win.document.write(
                                                    `<iframe src="${att.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                                );
                                            }
                                        }}
                                        className="group flex items-center gap-3 p-2 rounded-sm border border-border bg-background hover:border-primary-500/30 transition-all cursor-pointer"
                                    >
                                        {att.type.startsWith('image/') ? (
                                            <div className="w-8 h-8 rounded bg-surface border border-border overflow-hidden flex-shrink-0">
                                                <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center flex-shrink-0 text-text-muted">
                                                {getFileIcon(att.type, att.name)}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-text-primary truncate group-hover:text-primary-400 transition-colors" title={att.name}>{att.name}</div>
                                            <div className="text-[10px] text-text-muted">{Math.round(att.size / 1024)} KB</div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Native download
                                                    const link = document.createElement('a');
                                                    link.href = att.data;
                                                    link.download = att.name;
                                                    link.click();
                                                }}
                                                className="p-1.5 text-text-muted hover:text-primary-400 rounded transition-colors"
                                                title="Download"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteAttachment(task.id, att.id);
                                                }}
                                                className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-border/50 rounded-sm p-4 text-center">
                                <span className="text-xs text-text-muted cursor-default">Drag & drop files here (max 10MB)</span>
                            </div>
                        )}
                    </div>
                    <div className="w-full h-px bg-border/50" />

                    {/* Content Editor */}
                    <div className="flex flex-col gap-2 min-h-[300px]">
                        <span className="text-[10px] font-bold uppercase text-text-muted">Notes & Content</span>
                        <textarea
                            className="w-full flex-1 bg-transparent resize-none focus:outline-none text-sm leading-relaxed text-text-primary placeholder:text-text-muted/50"
                            placeholder="Type details, notes, or paste links here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
