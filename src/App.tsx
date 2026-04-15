import { useEffect, lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './components/ui/BottomNav';
import { useDailyState } from './hooks/useDailyState';
import { useProfile } from './hooks/useProfile';
import { useVault } from './hooks/useVault';
import { useStorage } from './hooks/useStorage';
import { KEYS, type DeviceMode } from './lib/keys';
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
const Guide = lazy(() => import('./screens/Guide'));
const CalendarScreen = lazy(() => import('./screens/Calendar'));
const ParentPortal = lazy(() => import('./screens/ParentPortal'));
const RewardsScreen = lazy(() => import('./screens/Rewards'));
const DeviceModeScreen = lazy(() => import('./screens/DeviceMode'));

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

  // Device mode (parent vs kid) is read once on mount from localStorage.
  // null = not yet picked → show picker; 'parent' | 'kid' = routes accordingly.
  const [deviceMode, setDeviceMode] = useState<DeviceMode | null>(() => {
    const stored = localStorage.getItem(KEYS.DEVICE_MODE);
    return stored === 'parent' || stored === 'kid' ? stored : null;
  });

  // Keep in sync if mode changes mid-session (e.g. Settings "switch device")
  useEffect(() => {
    function refresh() {
      const stored = localStorage.getItem(KEYS.DEVICE_MODE);
      setDeviceMode(stored === 'parent' || stored === 'kid' ? stored : null);
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const loading = stateLoading || profileLoading || vaultLoading || historyLoading;
  const isParent = deviceMode === 'parent';
  const needsMode = deviceMode === null;
  const needsWelcome = !loading && !isParent && !profile.userName;
  const appName = profile.appName || 'FocusFrame';

  // Update document title with custom app name
  useEffect(() => {
    document.title = appName;
  }, [appName]);

  // Day transition check on mount and visibility change
  useEffect(() => {
    if (loading || needsWelcome || isParent) return;

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

  // Redirect logic: mode picker → parent portal OR welcome → boot → dashboard
  useEffect(() => {
    if (loading) return;
    const path = location.pathname;

    if (needsMode && path !== '/mode') {
      navigate('/mode', { replace: true });
      return;
    }

    if (isParent) {
      // Parent device: always land on the portal. Allow /settings for the
      // "switch device mode" escape hatch; everything else redirects home.
      if (path !== '/parent' && path !== '/settings') {
        navigate('/parent', { replace: true });
      }
      return;
    }

    if (needsWelcome && path !== '/welcome') {
      navigate('/welcome', { replace: true });
    } else if (!needsWelcome && !state.bootDone && path !== '/boot' && path !== '/welcome') {
      navigate('/boot', { replace: true });
    }
  }, [loading, needsMode, isParent, needsWelcome, state.bootDone, location.pathname, navigate]);

  if (loading) return <LoadingSpinner />;

  const showNav =
    !isParent &&
    !needsMode &&
    location.pathname !== '/boot' &&
    location.pathname !== '/welcome' &&
    location.pathname !== '/guide' &&
    location.pathname !== '/mode';

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/mode" element={<DeviceModeScreen />} />
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
          <Route path="/rewards" element={<RewardsScreen />} />
          <Route path="/mood" element={<MoodCheckin />} />
          <Route path="/routines" element={<RoutinesScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/chat" element={<VegaJrScreen />} />
          <Route path="/parent" element={<ParentPortal />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {showNav && <BottomNav />}
    </div>
  );
}
