import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getContributionData,
  getCurrentStreak,
  getReadingGoal,
  setReadingGoal,
  getTodayPages,
  getRecordPages,
  getTotalPages12Weeks,
} from '@/lib/readingLog';

const ReadingLog = () => {
  const [goal, setGoal] = useState(getReadingGoal());
  const [editingGoal, setEditingGoal] = useState(false);
  const [sliderVal, setSliderVal] = useState(goal.pagesPerDay);

  const streak = getCurrentStreak();
  const todayPages = getTodayPages();
  const todayGoalMet = todayPages >= goal.pagesPerDay;
  const contributions = getContributionData(12);
  const record = getRecordPages();

  const handleSaveGoal = () => {
    const newGoal = { pagesPerDay: sliderVal };
    setReadingGoal(newGoal);
    setGoal(newGoal);
    setEditingGoal(false);
  };

  const handleManualInput = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 999) {
      setSliderVal(num);
    }
  };

  // Build grid: 7 rows (days) x N cols (weeks)
  const weeks: typeof contributions[0][][] = [];
  for (let i = 0; i < contributions.length; i += 7) {
    weeks.push(contributions.slice(i, i + 7));
  }

  const getCellColor = (day: typeof contributions[0]) => {
    if (day.pagesRead === 0) return 'bg-secondary';
    if (day.goalMet) return 'bg-primary';
    const ratio = Math.min(day.pagesRead / goal.pagesPerDay, 1);
    if (ratio > 0.5) return 'bg-primary/60';
    return 'bg-primary/30';
  };

  const dayLabels = ['', 'M', '', 'W', '', 'F', ''];

  return (
    <div className="space-y-3">
      {/* Stats row - compact, no icons */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-secondary p-2 text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Streak</span>
          <p className="text-xl font-bold text-foreground leading-tight">{streak}</p>
          <p className="text-[9px] text-muted-foreground">days</p>
        </div>
        <div className="rounded-lg bg-secondary p-2 text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Today</span>
          <p className={`text-xl font-bold leading-tight ${todayGoalMet ? 'text-primary' : 'text-foreground'}`}>
            {todayPages}
          </p>
          <p className="text-[9px] text-muted-foreground">/ {goal.pagesPerDay} pg</p>
        </div>
        <div className="rounded-lg bg-secondary p-2 text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Record</span>
          <p className="text-xl font-bold text-foreground leading-tight">{record}</p>
          <p className="text-[9px] text-muted-foreground">pages</p>
        </div>
      </div>

      {/* Today goal banner - compact */}
      {todayGoalMet && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center animate-[scale-in_0.3s_ease-out]">
          <span className="text-base">🎉</span>
          <p className="text-sm font-medium text-primary">Daily goal complete!</p>
        </div>
      )}

      {/* Contribution grid - scrollable */}
      <div>
        <h3 className="text-xs font-medium text-foreground mb-1.5">Reading Activity</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-0.5 pb-2">
            <div className="flex flex-col gap-0.5 mr-1 pt-0 shrink-0">
              {dayLabels.map((label, i) => (
                <div key={i} className="h-3 flex items-center">
                  <span className="text-[8px] text-muted-foreground w-4">{label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-0.5">
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
        </ScrollArea>
        <div className="flex items-center gap-1 mt-1 justify-end">
          <span className="text-[8px] text-muted-foreground">Less</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-secondary" />
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/30" />
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
          <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
          <span className="text-[8px] text-muted-foreground">More</span>
        </div>
      </div>

      {/* Goal setting */}
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-foreground">Daily Goal</h3>
          <button
            onClick={() => { setEditingGoal(!editingGoal); setSliderVal(goal.pagesPerDay); }}
            className="text-[10px] text-primary font-medium hover:underline"
          >
            {editingGoal ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editingGoal ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pages per day</span>
              <input
                type="number"
                value={sliderVal}
                onChange={(e) => handleManualInput(e.target.value)}
                min={1}
                max={999}
                className="w-16 text-right text-sm font-bold text-primary bg-secondary rounded px-2 py-0.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Slider
              value={[sliderVal]}
              onValueChange={([v]) => setSliderVal(v)}
              min={1}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>1</span>
              <span>100</span>
            </div>
            <button
              onClick={handleSaveGoal}
              className="w-full rounded-lg bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Save Goal
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Read <span className="font-semibold text-foreground">{goal.pagesPerDay} pages</span> every day
          </p>
        )}
      </div>
    </div>
  );
};

export default ReadingLog;
