import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Calendar, Send, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  getArticles,
  generateArticle,
  deleteArticle,
  scheduleArticle,
  postArticle,
} from '@/lib/api';
import type { GenerateArticleRequest } from '@/types';

export default function ArticlesList() {
  const [showNew, setShowNew] = useState(false);
  const [newArticle, setNewArticle] = useState<GenerateArticleRequest>({
    topic: '',
    focus: 'practical insights and best practices',
    targetLength: 'medium',
    tone: 'professional',
  });
  const [scheduleDate, setScheduleDate] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const res = await getArticles();
      return res.data.data?.articles || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setShowNew(false);
      setNewArticle({
        topic: '',
        focus: 'practical insights and best practices',
        targetLength: 'medium',
        tone: 'professional',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      scheduleArticle(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setScheduleDate({});
    },
  });

  const postMutation = useMutation({
    mutationFn: postArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(newArticle);
  };

  const handleSchedule = (id: string) => {
    const date = scheduleDate[id];
    if (!date) return;
    scheduleMutation.mutate({ id, date });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Artikel Verwaltung</h1>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Plus size={18} />
              Neuer Artikel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Article Form */}
        {showNew && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Neuen Artikel erstellen</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thema *
                </label>
                <input
                  type="text"
                  value={newArticle.topic}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, topic: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Länge
                  </label>
                  <select
                    value={newArticle.targetLength}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        targetLength: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="short">Kurz (500-800)</option>
                    <option value="medium">Mittel (800-1500)</option>
                    <option value="long">Lang (1500-2500)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ton
                  </label>
                  <select
                    value={newArticle.tone}
                    onChange={(e) =>
                      setNewArticle({ ...newArticle, tone: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="professional">Professionell</option>
                    <option value="casual">Casual</option>
                    <option value="inspirational">Inspirierend</option>
                    <option value="educational">Lehrreich</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fokus
                  </label>
                  <input
                    type="text"
                    value={newArticle.focus}
                    onChange={(e) =>
                      setNewArticle({ ...newArticle, focus: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {generateMutation.isPending ? 'Generiere...' : 'Generieren'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Articles List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Lade Artikel...</div>
        ) : !articlesData || articlesData.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Noch keine Artikel vorhanden</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {articlesData.map((article) => (
              <div key={article.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {article.topic}
                    </h3>
                    <div className="flex gap-2 text-sm text-gray-600">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        article.status === 'draft'
                          ? 'bg-gray-100 text-gray-800'
                          : article.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {article.status === 'draft' ? 'Entwurf' :
                         article.status === 'scheduled' ? 'Geplant' : 'Gepostet'}
                      </span>
                      {article.wordCount && (
                        <span className="text-gray-500">{article.wordCount} Wörter</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate(article.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {article.content}
                </p>

                <div className="flex gap-2">
                  {article.status === 'draft' && (
                    <>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="datetime-local"
                          value={scheduleDate[article.id] || ''}
                          onChange={(e) =>
                            setScheduleDate({ ...scheduleDate, [article.id]: e.target.value })
                          }
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleSchedule(article.id)}
                          disabled={!scheduleDate[article.id]}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          <Calendar size={16} />
                          Planen
                        </button>
                      </div>
                      <button
                        onClick={() => postMutation.mutate(article.id)}
                        disabled={postMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <Send size={16} />
                        Sofort posten
                      </button>
                    </>
                  )}

                  {article.status === 'scheduled' && article.scheduledFor && (
                    <div className="text-sm text-gray-600">
                      Geplant für: {format(new Date(article.scheduledFor), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </div>
                  )}

                  {article.status === 'posted' && article.postedAt && (
                    <div className="text-sm text-green-600">
                      Gepostet: {format(new Date(article.postedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
