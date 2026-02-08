import { LoadSettings, SaveSettings } from '../../wailsjs/go/main/App';
import { TLUserPreferences, defaultUserPreferences } from 'tldraw';

const USER_PREFS_KEY = 'userPreferences';
const INSTANCE_STATE_KEY = 'instanceState';
const DEFAULT_USER_ID = 'rishah-user';

export interface InstanceState {
  isGridMode: boolean;
}

// Calculate diff between prefs and defaults
const getDiff = <T extends Record<string, any>>(obj: T, defaults: Partial<T>): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([key, value]) =>
      key === 'id' || (key in defaults && defaults[key] !== value)
    )
  ) as Partial<T>;

// Get all settings as an object
async function getAllSettings(): Promise<Record<string, any>> {
  try {
    const raw = await LoadSettings();
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Save all settings
async function setAllSettings(settings: Record<string, any>): Promise<void> {
  await SaveSettings(JSON.stringify(settings));
}

// Create default user preferences with custom settings
function createDefaultPreferences(): TLUserPreferences {
  return {
    ...defaultUserPreferences,
    isSnapMode: true,
    id: DEFAULT_USER_ID
  };
}

// Initialize user preferences (load or create)
export async function initializeUserPreferences(): Promise<TLUserPreferences> {
  try {
    const settings = await getAllSettings();
    const savedPrefs = settings[USER_PREFS_KEY] as Partial<TLUserPreferences> | undefined;

    if (savedPrefs) {
      // Merge saved changes with defaults
      return {
        ...createDefaultPreferences(),
        ...savedPrefs,
      };
    }

    // First time - save only the ID
    settings[USER_PREFS_KEY] = { id: DEFAULT_USER_ID };
    await setAllSettings(settings);

    return createDefaultPreferences();
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return createDefaultPreferences();
  }
}

// Save user preferences (only what changed from defaults)
export async function saveUserPreferences(prefs: TLUserPreferences): Promise<void> {
  try {
    const settings = await getAllSettings();
    const changedPrefs = getDiff(prefs, defaultUserPreferences);

    settings[USER_PREFS_KEY] = changedPrefs;
    await setAllSettings(settings);
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

// Load instance state
export async function loadInstanceState(): Promise<InstanceState | null> {
  try {
    const settings = await getAllSettings();
    return (settings[INSTANCE_STATE_KEY] as InstanceState) ?? null;
  } catch (error) {
    console.error('Failed to load instance state:', error);
    return null;
  }
}

// Save instance state
export async function saveInstanceState(state: InstanceState): Promise<void> {
  try {
    const settings = await getAllSettings();
    settings[INSTANCE_STATE_KEY] = state;
    await setAllSettings(settings);
  } catch (error) {
    console.error('Failed to save instance state:', error);
  }
}