import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  LearningLesson,
  LearningTopic,
  readLessonsFromStorage,
  readTopicsFromStorage,
  writeLessonsToStorage,
  writeTopicsToStorage,
} from '@/hooks/useLearnData';

const TOPIC_COLORS = ['green', 'blue', 'orange', 'purple', 'gray'];
const ICON_SUGGESTIONS = ['🌡️', '💧', '♻️', '⚡', '🌱', '🌍', '🌳', '🔥', '🏭', '🦋', '☀️', '🌊', '🧪', '🛰️', '🍃'];

const emptyTopicForm = { title: '', icon: '', color: 'green' };
const emptyLessonForm = { topic_id: '', title: '', content: '', points: 10 };

export default function TeacherContent() {
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [lessons, setLessons] = useState<LearningLesson[]>([]);

  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);

  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const [topicForm, setTopicForm] = useState(emptyTopicForm);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);

  const loadData = () => {
    const loadedTopics = readTopicsFromStorage();
    const loadedLessons = readLessonsFromStorage();
    setTopics(loadedTopics);
    setLessons(loadedLessons);

    if (!lessonForm.topic_id && loadedTopics.length > 0) {
      setLessonForm((prev) => ({ ...prev, topic_id: loadedTopics[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lessonsByTopic = useMemo(() => {
    const map: Record<string, LearningLesson[]> = {};
    topics.forEach((t) => {
      map[t.id] = lessons.filter((l) => l.topic_id === t.id);
    });
    return map;
  }, [topics, lessons]);

  const openAddTopic = () => {
    setEditingTopicId(null);
    setTopicForm(emptyTopicForm);
    setTopicModalOpen(true);
  };

  const openEditTopic = (topic: LearningTopic) => {
    setEditingTopicId(topic.id);
    setTopicForm({ title: topic.title, icon: topic.icon, color: topic.color });
    setTopicModalOpen(true);
  };

  const saveTopic = () => {
    const current = readTopicsFromStorage();

    if (editingTopicId) {
      const updated = current.map((t) =>
        t.id === editingTopicId
          ? { ...t, title: topicForm.title.trim(), icon: topicForm.icon.trim(), color: topicForm.color }
          : t
      );
      writeTopicsToStorage(updated);
    } else {
      const created: LearningTopic = {
        id: Date.now().toString(),
        title: topicForm.title.trim(),
        icon: topicForm.icon.trim(),
        color: topicForm.color,
      };
      current.push(created);
      writeTopicsToStorage(current);
    }

    setTopicModalOpen(false);
    setTopicForm(emptyTopicForm);
    loadData();
  };

  const deleteTopic = (id: string) => {
    const nextTopics = readTopicsFromStorage().filter((t) => t.id !== id);
    const nextLessons = readLessonsFromStorage().filter((l) => l.topic_id !== id);
    writeTopicsToStorage(nextTopics);
    writeLessonsToStorage(nextLessons);
    loadData();
  };

  const openAddLesson = (topicId?: string) => {
    setEditingLessonId(null);
    setLessonForm({ ...emptyLessonForm, topic_id: topicId || topics[0]?.id || '' });
    setLessonModalOpen(true);
  };

  const openEditLesson = (lesson: LearningLesson) => {
    setEditingLessonId(lesson.id);
    setLessonForm({
      topic_id: lesson.topic_id,
      title: lesson.title,
      content: lesson.content,
      points: lesson.points,
    });
    setLessonModalOpen(true);
  };

  const saveLesson = () => {
    const current = readLessonsFromStorage();

    if (editingLessonId) {
      const updated = current.map((l) =>
        l.id === editingLessonId
          ? {
              ...l,
              topic_id: lessonForm.topic_id,
              title: lessonForm.title.trim(),
              content: lessonForm.content.trim(),
              points: Number(lessonForm.points || 0),
            }
          : l
      );
      writeLessonsToStorage(updated);
    } else {
      const created: LearningLesson = {
        id: Date.now().toString(),
        topic_id: lessonForm.topic_id,
        title: lessonForm.title.trim(),
        content: lessonForm.content.trim(),
        points: Number(lessonForm.points || 0),
      };
      current.push(created);
      writeLessonsToStorage(current);
    }

    setLessonModalOpen(false);
    setLessonForm(emptyLessonForm);
    loadData();
  };

  const deleteLesson = (id: string) => {
    const nextLessons = readLessonsFromStorage().filter((l) => l.id !== id);
    writeLessonsToStorage(nextLessons);
    loadData();
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-3xl text-jungle-deep">Learning Content</h1>
        <div className="flex gap-2">
          <Button onClick={openAddTopic} className="rounded-xl font-heading font-bold">
            <Plus className="w-4 h-4 mr-2" /> Add Topic
          </Button>
          <Button onClick={() => openAddLesson()} variant="outline" className="rounded-xl font-heading font-bold">
            <BookOpen className="w-4 h-4 mr-2" /> Add Lesson
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic) => {
          const topicLessons = lessonsByTopic[topic.id] || [];
          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card shadow-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-3xl">{topic.icon}</p>
                  <h2 className="mt-2 font-heading font-bold text-foreground">{topic.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Layers className="inline h-3 w-3 mr-1" />
                    {topicLessons.length} lesson{topicLessons.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEditTopic(topic)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteTopic(topic.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {topicLessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lessons yet.</p>
                ) : (
                  topicLessons.map((lesson) => (
                    <div key={lesson.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-heading font-semibold text-sm text-foreground">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{lesson.points} pts</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditLesson(lesson)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteLesson(lesson.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Button onClick={() => openAddLesson(topic.id)} variant="outline" className="mt-4 w-full rounded-xl font-heading font-bold">
                <Plus className="w-4 h-4 mr-2" /> Add Lesson
              </Button>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={topicModalOpen} onOpenChange={setTopicModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl text-jungle-deep">
              {editingTopicId ? 'Edit Topic' : 'Add Topic'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Topic title"
              value={topicForm.title}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Input
              placeholder="Icon (example: 🌡️)"
              list="topic-icon-suggestions"
              value={topicForm.icon}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, icon: e.target.value }))}
            />
            <datalist id="topic-icon-suggestions">
              {ICON_SUGGESTIONS.map((icon) => (
                <option key={icon} value={icon} />
              ))}
            </datalist>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={topicForm.color}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, color: e.target.value }))}
            >
              {TOPIC_COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
            <Button
              onClick={saveTopic}
              disabled={!topicForm.title.trim() || !topicForm.icon.trim()}
              className="w-full rounded-xl font-heading font-bold"
            >
              {editingTopicId ? 'Update Topic' : 'Create Topic'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonModalOpen} onOpenChange={setLessonModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl text-jungle-deep">
              {editingLessonId ? 'Edit Lesson' : 'Add Lesson'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={lessonForm.topic_id}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, topic_id: e.target.value }))}
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
            <Input
              placeholder="Lesson title"
              value={lessonForm.title}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="w-full rounded-md border border-input bg-background p-3 text-sm min-h-[140px]"
              placeholder="Lesson content"
              value={lessonForm.content}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, content: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              placeholder="Points"
              value={lessonForm.points}
              onChange={(e) => setLessonForm((prev) => ({ ...prev, points: Number(e.target.value || 0) }))}
            />
            <Button
              onClick={saveLesson}
              disabled={!lessonForm.topic_id || !lessonForm.title.trim() || !lessonForm.content.trim()}
              className="w-full rounded-xl font-heading font-bold"
            >
              {editingLessonId ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
