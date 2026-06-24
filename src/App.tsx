import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Specialties from './pages/Specialties';
import CasePlayer from './pages/CasePlayer';
import Profile from './pages/Profile';
import AchievementGallery from './pages/AchievementGallery';
import Career from './pages/Career';
import CaseBuilder from './pages/CaseBuilder';
import NightShift from './pages/NightShift';
import LevelUpNotification from './components/LevelUpNotification';
import AchievementToast from './components/AchievementToast';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingModal, { isOnboardingDone } from './components/OnboardingModal';
import type { PlayerProfile, Achievement } from './types/profile';
import { loadProfile, saveProfile, createProfile } from './engine/profileEngine';
import { getAchievement } from './engine/achievementEngine';
import { ALL_CASES } from './data/allCases';

type Page = 'home' | 'specialties' | 'play' | 'profile' | 'achievements' | 'career' | 'builder' | 'night-shift';

interface LevelUpNotif {
  newRank: string;
  newLevel: number;
  unlockedSpecialty?: string;
}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    return loadProfile() ?? createProfile('Doctor');
  });
  const [levelUpNotif, setLevelUpNotif] = useState<LevelUpNotif | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !isOnboardingDone());

  // Persist profile whenever it changes
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const activeCase = ALL_CASES.find(c => c.id === activeCaseId) ?? null;

  const handleSelectCase = (id: string) => {
    setActiveCaseId(id);
    setPage('play');
  };

  const handleCaseComplete = (updatedProfile: PlayerProfile, prevLevel: number, newAchievementIds: string[]) => {
    const prevProfile = profile;
    setProfile(updatedProfile);

    // Level-up notification
    if (updatedProfile.level > prevLevel) {
      setLevelUpNotif({
        newRank: updatedProfile.rank,
        newLevel: updatedProfile.level,
        unlockedSpecialty: updatedProfile.unlockedSpecialties.find(
          s => !prevProfile.unlockedSpecialties.includes(s)
        ),
      });
    }

    // Achievement notifications
    if (newAchievementIds.length > 0) {
      const earned = newAchievementIds
        .map(id => getAchievement(id))
        .filter((a): a is Achievement => a !== undefined);
      setNewAchievements(prev => [...prev, ...earned]);
    }
  };

  const dismissAchievement = (id: string) => {
    setNewAchievements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-slate-900 text-slate-100">

      {/* Page routing */}
      {page === 'home' && (
        <Home
          onNavigate={(p) => setPage(p as Page)}
          profile={profile}
        />
      )}

      {page === 'specialties' && (
        <Specialties
          onSelectCase={handleSelectCase}
          onBack={() => setPage('home')}
          unlockedSpecialties={profile.unlockedSpecialties}
        />
      )}

      {page === 'play' && activeCase && (
        <CasePlayer
          key={activeCaseId}
          caseData={activeCase}
          profile={profile}
          onHome={() => setPage('home')}
          onCaseComplete={handleCaseComplete}
        />
      )}

      {page === 'profile' && (
        <Profile
          profile={profile}
          onBack={() => setPage('home')}
          onNavigateAchievements={() => setPage('achievements')}
        />
      )}

      {page === 'achievements' && (
        <AchievementGallery
          unlockedIds={profile.unlockedAchievementIds}
          onBack={() => setPage('profile')}
        />
      )}

      {page === 'career' && (
        <Career
          profile={profile}
          onBack={() => setPage('home')}
          onPlayCase={handleSelectCase}
        />
      )}

      {page === 'builder' && (
        <CaseBuilder onBack={() => setPage('home')} />
      )}

      {page === 'night-shift' && (
        <NightShift
          profile={profile}
          onHome={() => setPage('home')}
          onShiftComplete={(updated) => setProfile(updated)}
        />
      )}

      {/* Global overlays */}
      {levelUpNotif && (
        <LevelUpNotification
          newRank={levelUpNotif.newRank}
          newLevel={levelUpNotif.newLevel}
          unlockedSpecialty={levelUpNotif.unlockedSpecialty}
          onDismiss={() => setLevelUpNotif(null)}
        />
      )}

      {newAchievements.length > 0 && (
        <AchievementToast
          achievements={newAchievements}
          onDismiss={dismissAchievement}
        />
      )}

      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
    </ErrorBoundary>
  );
}

export default App;
