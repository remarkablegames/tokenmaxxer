import { useState } from 'react';
import { ModalShell } from 'src/components/ModalShell';
import { ACHIEVEMENTS, formatNumber, getRecordTarget } from 'src/services/game';

export type ArchiveTab = 'milestones' | 'achievements';

interface ChampionArchiveModalProps {
  achievementIds: string[];
  bonuses: number[];
  initialTab: ArchiveTab;
  onClose: () => void;
  onCloseButton?: () => void;
}

function formatMilestoneTarget(target: number): string {
  return formatNumber(target).replace(/\.0+(?=[A-Za-z])/u, '');
}

export function ChampionArchiveModal({
  achievementIds,
  bonuses,
  initialTab,
  onClose,
  onCloseButton,
}: ChampionArchiveModalProps) {
  const [activeTab, setActiveTab] = useState<ArchiveTab>(initialTab);

  return (
    <ModalShell
      onClose={onClose}
      onCloseButton={onCloseButton}
      title="Champion Archive"
    >
      <div
        aria-label="Champion Archive sections"
        className="mb-4 grid grid-cols-2 rounded-xl border border-white/8 bg-black/20 p-1"
        role="tablist"
      >
        <button
          aria-controls="archive-panel"
          aria-selected={activeTab === 'milestones'}
          className={`cursor-pointer rounded-lg px-4 py-3 text-sm font-extrabold transition-colors ${activeTab === 'milestones' ? 'bg-cyan-400/12 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
          id="milestones-tab"
          onClick={() => {
            setActiveTab('milestones');
          }}
          role="tab"
          type="button"
        >
          Milestones
        </button>
        <button
          aria-controls="archive-panel"
          aria-selected={activeTab === 'achievements'}
          className={`cursor-pointer rounded-lg px-4 py-3 text-sm font-extrabold transition-colors ${activeTab === 'achievements' ? 'bg-cyan-400/12 text-cyan-200' : 'text-slate-400 hover:text-slate-200'}`}
          id="achievements-tab"
          onClick={() => {
            setActiveTab('achievements');
          }}
          role="tab"
          type="button"
        >
          Achievements
        </button>
      </div>
      <div
        aria-labelledby={`${activeTab}-tab`}
        id="archive-panel"
        role="tabpanel"
      >
        {activeTab === 'milestones' ? (
          <ol className="grid gap-2 sm:grid-cols-2">
            {[...bonuses]
              .sort((left, right) => left - right)
              .map((index) => (
                <li
                  className="flex items-center justify-between gap-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"
                  key={index}
                >
                  <span>
                    <small className="block text-xs font-bold tracking-[0.14em] text-slate-400">
                      MILESTONE #{index + 1}
                    </small>
                    <strong className="mt-1 block text-xl text-amber-200">
                      {formatMilestoneTarget(getRecordTarget(index))}
                    </strong>
                  </span>
                  <span className="text-xs font-extrabold tracking-[0.12em] text-emerald-300">
                    ◆ SECURED
                  </span>
                </li>
              ))}
          </ol>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {ACHIEVEMENTS.map((achievement) => (
              <div
                className={`flex items-center gap-3 rounded-xl border p-3 ${achievementIds.includes(achievement.id) ? 'border-amber-300/25 bg-amber-300/5 opacity-100' : 'border-white/6 opacity-60'}`}
                key={achievement.id}
              >
                <span className="text-amber-400">
                  {achievementIds.includes(achievement.id) ? '◆' : '◇'}
                </span>
                <div className="[&_small]:block [&_small]:text-xs [&_small]:text-slate-400 [&_strong]:block">
                  <strong>{achievement.name}</strong>
                  <small>{achievement.description}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
