import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LogOut, Mail, Send, FileText, Calendar } from 'lucide-react';
import { logout, getSchedule, generatePostEmail, postAction } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import type { GeneratePostRequest } from '@/types';

export default function Dashboard() {
  const [topic, setTopic] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { data: schedule } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const res = await getSchedule();
      return res.data;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      navigate('/login');
    },
  });

  const postMutation = useMutation({
    mutationFn: (data: GeneratePostRequest) => postAction('1', data),
    onSuccess: (res) => {
      setMessage(`✓ ${res.data.message || 'Post erfolgreich!'}`);
      setTopic('');
      setTimeout(() => setMessage(''), 5000);
    },
    onError: (error: any) => {
      setMessage(`✗ ${error.response?.data?.error || 'Fehler beim Posten'}`);
      setTimeout(() => setMessage(''), 5000);
    },
  });

  const emailMutation = useMutation({
    mutationFn: generatePostEmail,
    onSuccess: () => {
      setMessage('✓ Post per Email versendet!');
      setTopic('');
      setTimeout(() => setMessage(''), 5000);
    },
    onError: (error: any) => {
      setMessage(`✗ ${error.response?.data?.error || 'Email-Fehler'}`);
      setTimeout(() => setMessage(''), 5000);
    },
  });

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    postMutation.mutate({ topic, useAI });
  };

  const handleEmailPost = async () => {
    if (!topic.trim()) return;
    emailMutation.mutate(topic);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Button Dashboard</h1>
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut size={18} />
            Abmelden
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.startsWith('✓')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* LinkedIn Post Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Send className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold">LinkedIn Post</h2>
            </div>

            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thema oder Post-Text
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Gib ein Thema ein..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useAI"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useAI" className="text-sm text-gray-700">
                  Mit AI generieren
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={postMutation.isPending || !topic.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                  {postMutation.isPending ? 'Poste...' : 'Sofort posten'}
                </button>

                <button
                  type="button"
                  onClick={handleEmailPost}
                  disabled={emailMutation.isPending || !topic.trim()}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Mail size={18} />
                  {emailMutation.isPending ? 'Sende...' : 'Per Email'}
                </button>
              </div>
            </form>
          </div>

          {/* Schedule Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold">Geplante Posts</h2>
            </div>

            {schedule && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    schedule.enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {schedule.enabled ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Zeit:</span>
                  <span className="text-sm text-gray-600">{schedule.time} {schedule.timezone}</span>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700 block mb-2">
                    Themen ({schedule.topics.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {schedule.topics.slice(0, 3).map((topic, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {topic}
                      </span>
                    ))}
                    {schedule.topics.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{schedule.topics.length - 3} mehr
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Article Management Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-purple-600" size={24} />
              <h2 className="text-xl font-semibold">Artikel Verwaltung</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Erstelle, verwalte und plane LinkedIn-Artikel
            </p>

            <button
              onClick={() => navigate('/articles')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Artikel verwalten
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
