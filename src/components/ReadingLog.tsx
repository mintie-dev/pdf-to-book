import { useState } from 'react';
import { Flame, Target, TrendingUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  getContributionData,
  getCurrentStreak,
  getReadingGoal,
  setReadingGoal,
  getTodayPages,
} from '@/lib/readingLog';

const ReadingLog = () => {
  const [goal, setGoal] = useState(getReadingGoal());
  const [editingGoal, setEditingGoal] = useState(false);
  const [sliderVal, setSliderVal] = useState(goal.pagesPerDay);

  const streak = getCurrentStreak();
  const todayPages = getTodayPages();
  const todayGoalMet = todayPages >= goal.pagesPerDay;
  const contributions = getContributionData(12);

  const totalPages = contributions.reduce((s, d) => s + d.pagesRead, 0);
  const activeDays = contributions.filter(d => d.pagesRead > 0).length;

  const handleSaveGoal = () => {
    const newGoal = { pagesPerDay: sliderVal };
    setReadingGoal(newGoal);
    setGoal(newGoal);
    setEditingGoal(false);
  };

  // Build grid: 7 rows (days) x N cols (weeks)
  const weeks: typeof contributions[0][][] = [];
  for (let i = 0; i < contributions.length; i += 7) {
    weeks.push(contributions.slice(i, i + 7));
  }

  const getCellColor = (day: typeof contributions[0]) => {
    if (day.pagesRead === 0) return 'bg-secondary';
    if (day.goalMet) return 'bg-primary';
    // Partial progress
    const ratio = Math.min(day.pagesRead / goal.pagesPerDay, 1);
    if (ratio > 0.5) return 'bg-primary/60';
    return 'bg-primary/30';
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-secondary p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Streak</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{streak}</p>
          <p className="text-[10px] text-muted-foreground">days</p>
        </div>
        <div className="rounded-xl bg-secondary p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Today</span>
          </div>
          <p className={`text-2xl font-bold ${todayGoalMet ? 'text-primary' : 'text-foreground'}`}>
            {todayPages}
          </p>
          <p className="text-[10px] text-muted-foreground">/ {goal.pagesPerDay} pages</p>
        </div>
        <div className="rounded-xl bg-secondary p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Active</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeDays}</p>
          <p className="text-[10px] text-muted-foreground">/ {contributions.length} days</p>
        </div>
      </div>

      {/* Today goal banner */}
      {todayGoalMet && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center animate-[scale-in_0.3s_ease-out]">
          <span className="text-lg">🎉</span>
          <p className="text-sm font-medium text-primary">Daily goal complete!</p>
          <p className="text-xs text-muted-foreground">You read {todayPages} pages today</p>
        </div>
      )}

      {/* Contribution grid */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2">Reading Activity</h3>
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1 pt-0">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-3 flex items-center">
                <span className="text-[9px] text-muted-foreground w-6">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-0.5 overflow-x-auto">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`h-3 w-3 rounded-sm ${getCellColor(day)} transition-colors`}
                    title={`${day.date}: ${day.pagesRead} pages`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[9px] text-muted-foreground">Less</span>
          <div className="h-3 w-3 rounded-sm bg-secondary" />
          <div className="h-3 w-3 rounded-sm bg-primary/30" />
          <div className="h-3 w-3 rounded-sm bg-primary/60" />
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </div>

      {/* Goal setting */}
      <div className="rounded-xl border border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Daily Goal</h3>
          <button
            onClick={() => { setEditingGoal(!editingGoal); setSliderVal(goal.pagesPerDay); }}
            className="text-xs text-primary font-medium hover:underline"
          >
            {editingGoal ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editingGoal ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pages per day</span>
              <span className="text-lg font-bold text-primary">{sliderVal}</span>
            </div>
            <Slider
              value={[sliderVal]}
              onValueChange={([v]) => setSliderVal(v)}
              min={1}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 page</span>
              <span>100 pages</span>
            </div>
            <button
              onClick={handleSaveGoal}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Save Goal
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Read <span className="font-semibold text-foreground">{goal.pagesPerDay} pages</span> every day
          </p>
        )}
      </div>

      {/* Total pages */}
      <p className="text-xs text-muted-foreground text-center">
        {totalPages} pages read in the last 12 weeks
      </p>
    </div>
  );
};

export default ReadingLog;
