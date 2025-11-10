import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSchedule, updateSchedule } from '@/lib/api';
import type { ScheduleConfig, PostingTime } from '@/types';

export default function AdvancedSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [enabled, setEnabled] = useState(false);
  const [timezone, setTimezone] = useState('Europe/Berlin');
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [postingTimes, setPostingTimes] = useState<PostingTime[]>([
    { hour: 9, minute: 0, jitterMinutes: 30 },
  ]);
  const [weekdays, setWeekdays] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    false,
    false,
  ]);
  const [message, setMessage] = useState('');

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      try {
        const res = await getSchedule();
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          navigate('/login');
        }
        throw err;
      }
    },
    retry: false,
  });

  // Load schedule data into state
  useEffect(() => {
    if (schedule) {
      setEnabled(schedule.enabled);
      setTimezone(schedule.timezone);
      setTopics(schedule.topics || []);
      setPostingTimes(
        schedule.postingTimes?.length > 0
          ? schedule.postingTimes
          : [{ hour: 9, minute: 0, jitterMinutes: 30 }]
      );
      setWeekdays(
        schedule.weekdays?.length === 7
          ? schedule.weekdays
          : [true, true, true, true, true, false, false]
      );
    }
  }, [schedule]);

  const updateMutation = useMutation({
    mutationFn: (config: Partial<ScheduleConfig>) => updateSchedule(config),
    onSuccess: () => {
      setMessage('✓ Einstellungen erfolgreich gespeichert!');
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      setTimeout(() => setMessage(''), 5000);
    },
    onError: (error: any) => {
      setMessage(`✗ ${error.response?.data?.error || 'Fehler beim Speichern'}`);
      setTimeout(() => setMessage(''), 5000);
    },
  });

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleAddPostingTime = () => {
    setPostingTimes([...postingTimes, { hour: 9, minute: 0, jitterMinutes: 30 }]);
  };

  const handleRemovePostingTime = (index: number) => {
    if (postingTimes.length > 1) {
      setPostingTimes(postingTimes.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePostingTime = (
    index: number,
    field: keyof PostingTime,
    value: number
  ) => {
    const updated = [...postingTimes];
    updated[index] = { ...updated[index], [field]: value };
    setPostingTimes(updated);
  };

  const handleToggleWeekday = (index: number) => {
    const updated = [...weekdays];
    updated[index] = !updated[index];
    setWeekdays(updated);
  };

  const handleSave = () => {
    // Validate at least one topic
    if (topics.length === 0) {
      setMessage('✗ Bitte mindestens ein Thema hinzufügen');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Validate at least one weekday
    if (!weekdays.some((day) => day)) {
      setMessage('✗ Bitte mindestens einen Wochentag auswählen');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Validate at least one posting time
    if (postingTimes.length === 0) {
      setMessage('✗ Bitte mindestens eine Posting-Zeit hinzufügen');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    const config: Partial<ScheduleConfig> = {
      enabled,
      timezone,
      topics,
      postingTimes,
      weekdays,
    };

    updateMutation.mutate(config);
  };

  const weekdayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Lade Einstellungen...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Erweiterte Einstellungen</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-md flex items-center gap-2 ${
              message.startsWith('✓')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <AlertCircle size={20} />
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                Automatisches Posting aktivieren
              </label>
            </div>
          </div>

          {/* Topics */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold">Themen verwalten</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Themen werden der Reihe nach abgearbeitet und wiederholen sich automatisch.
            </p>

            <div className="space-y-3">
              {/* Topic List */}
              {topics.length > 0 && (
                <div className="space-y-2">
                  {topics.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <span className="text-sm text-gray-700">
                        {index + 1}. {topic}
                      </span>
                      <button
                        onClick={() => handleRemoveTopic(index)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Topic */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                  placeholder="Neues Thema hinzufügen..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddTopic}
                  disabled={!newTopic.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={18} />
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>

          {/* Posting Times */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="text-green-600" size={20} />
              <h2 className="text-lg font-semibold">Posting-Zeiten</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Lege fest, zu welchen Uhrzeiten automatisch gepostet werden soll. Die tatsächliche
              Zeit variiert zufällig im angegebenen Bereich (Jitter).
            </p>

            <div className="space-y-4">
              {postingTimes.map((time, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Posting-Zeit {index + 1}
                    </span>
                    {postingTimes.length > 1 && (
                      <button
                        onClick={() => handleRemovePostingTime(index)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Stunde (0-23)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={time.hour}
                        onChange={(e) =>
                          handleUpdatePostingTime(index, 'hour', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Minute (0-59)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={time.minute}
                        onChange={(e) =>
                          handleUpdatePostingTime(index, 'minute', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Jitter (Varianz in Minuten: ±{time.jitterMinutes})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={time.jitterMinutes}
                      onChange={(e) =>
                        handleUpdatePostingTime(
                          index,
                          'jitterMinutes',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Keine Varianz</span>
                      <span>±60 Min</span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddPostingTime}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus size={18} />
                Weitere Posting-Zeit hinzufügen
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Wochentage</h2>

            <p className="text-sm text-gray-600 mb-4">
              Wähle die Wochentage aus, an denen automatisch gepostet werden soll.
            </p>

            <div className="grid grid-cols-7 gap-2">
              {weekdayLabels.map((label, index) => (
                <button
                  key={index}
                  onClick={() => handleToggleWeekday(index)}
                  className={`py-3 px-2 text-sm font-medium rounded-md transition-colors ${
                    weekdays[index]
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Zeitzone</h2>

            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Europe/Berlin">Europe/Berlin (MEZ/MESZ)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={20} />
              {updateMutation.isPending ? 'Speichere...' : 'Einstellungen speichern'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
