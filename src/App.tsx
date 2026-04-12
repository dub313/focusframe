import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './components/ui/BottomNav';
import { useDailyState } from './hooks/useDailyState';
import { useProfile } from './hooks/useProfile';
import { useVault } from './hooks/useVault';
import { useStorage } from './hooks/useStorage';
import { KEYS } from './lib/keys';
import { isDayTransition, getToday, createFreshState, rolloverState } from './lib/day';
import type { DailySummary } from './types';

const Welcome = lazy(() => import('./screens/Welcome'));
const BootSequence = lazy(() => import('./screens/BootSequence'));
const Dashboard = lazy(() => import('./screens/Dashboard'));
const AddTask = lazy(() => import('./screens/AddTask'));
const FocusMode = lazy(() => import('./screens/FocusMode'));
const GrowthMap = lazy(() => import('./screens/GrowthMap'));
const MoreMenu = lazy(() => import('./screens/MoreMenu'));
const VaultScreen = lazy(() => import('./screens/Vault'));
const MoodCheckin = lazy(() => import('./screens/MoodCheckin'));
const RoutinesScreen = lazy(() => import('./screens/Routines'));
const SettingsScreen = lazy(() => import('./screens/Settings'));
const VegaJrScreen = lazy(() => import('./screens/VegaJr'));
const ParentConfig = lazy(() => import('./screens/ParentConfig'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-[#22d3ee] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function App() {
  const { state, loading: stateLoading, setState } = useDailyState();
  const { profile, loading: profileLoading, set: setProfile } = useProfile();
  const { vault, loading: vaultLoading, set: setVault } = useVault();
  const { data: history, loading: historyLoading, set: setHistory } = useStorage<DailySummary[]>(KEYS.HISTORY, []);
  const location = useLocation();
  const navigate = useNavigate();

  const loading = stateLoading || profileLoading || vaultLoading || historyLoading;
  const needsWelcome = !loading && !profile.userName;
  const appName = profile.appName || 'FocusFrame';

  // Update document title with custom app name
  useEffect(() => {
    document.title = appName;
  }, [appName]);

  // Day transition check on mount and visibility change
  useEffect(() => {
    if (loading || needsWelcome) return;

    function checkDayTransition() {
      if (isDayTransition(state.date)) {
        if (state.bootDone) {
          const result = rolloverState(state, profile, vault, history);
          setState(result.newState);
          setProfile(result.updatedProfile);
          setVault(result.updatedVault);
          setHistory(result.updatedHistory);
        } else {
          setState(createFreshState(getToday()));
        }
      }
    }

    checkDayTransition();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDayTransition();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loading, needsWelcome, state, profile, vault, history, setState, setProfile, setVault, setHistory]);

  // Redirect logic: welcome → boot → dashboard
  useEffect(() => {
    if (loading) return;
    const path = location.pathname;

    if (needsWelcome && path !== '/welcome') {
      navigate('/welcome', { replace: true });
    } else if (!needsWelcome && !state.bootDone && path !== '/boot' && path !== '/welcome') {
      navigate('/boot', { replace: true });
    }
  }, [loading, needsWelcome, state.bootDone, location.pathname, navigate]);

  if (loading) return <LoadingSpinner />;

  const showNav = location.pathname !== '/boot' && location.pathname !== '/welcome';

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/boot" element={needsWelcome ? <Navigate to="/welcome" replace /> : <BootSequence />} />
          <Route path="/" element={
            needsWelcome ? <Navigate to="/welcome" replace /> :
            state.bootDone ? <Dashboard /> :
            <Navigate to="/boot" replace />
          } />
          <Route path="/add-task" element={<AddTask />} />
          <Route path="/focus" element={<FocusMode />} />
          <Route path="/growth" element={<GrowthMap />} />
          <Route path="/more" element={<MoreMenu />} />
          <Route path="/vault" element={<VaultScreen />} />
          <Route path="/mood" element={<MoodCheckin />} />
          <Route path="/routines" element={<RoutinesScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/chat" element={<VegaJrScreen />} />
          <Route path="/parent" element={<ParentConfig />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {showNav && <BottomNav />}
    </div>
  );
}
