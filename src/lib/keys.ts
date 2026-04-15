export const KEYS = {
  STATE: 'focusframe:state',
  PROFILE: 'focusframe:profile',
  VAULT: 'focusframe:vault',
  HISTORY: 'focusframe:history',
  ROUTINES: 'focusframe:routines',
  CONTINUOUS: 'focusframe:continuous',
  SETTINGS: 'focusframe:settings',
  CHAT: 'focusframe:chat',
  DEVICE_MODE: 'focusframe:deviceMode',
} as const;

export type DeviceMode = 'parent' | 'kid';
