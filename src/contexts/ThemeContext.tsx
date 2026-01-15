import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  color: string; // hex
  resolvedScheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => Promise<void>;
  setColor: (color: string) => Promise<void>;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    mutedText: string;
    danger: string;
  };
  navigationTheme: any;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DEFAULT_PRIMARY = '#3B82F6';

function clampHexColor(input: string): string {
  const v = (input || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toUpperCase();
  return DEFAULT_PRIMARY;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const { user } = useAuth();

  const [mode, setModeState] = useState<ThemeMode>('system');
  const [color, setColorState] = useState<string>(DEFAULT_PRIMARY);

  const resolvedScheme: 'light' | 'dark' = useMemo(() => {
    const sys = systemScheme === 'dark' ? 'dark' : 'light';
    if (mode === 'system') return sys;
    return mode;
  }, [mode, systemScheme]);

  // load from profiles when user changes
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) {
        setModeState('system');
        setColorState(DEFAULT_PRIMARY);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, theme_mode, theme_color')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        // fallback to defaults
        setModeState('system');
        setColorState(DEFAULT_PRIMARY);
        return;
      }

      if (!data) {
        // create profile row if missing
        await supabase.from('profiles').insert([
          {
            id: user.id,
            email: user.email || '',
            theme_mode: 'system',
            theme_color: DEFAULT_PRIMARY,
          },
        ]);
        if (cancelled) return;
        setModeState('system');
        setColorState(DEFAULT_PRIMARY);
        return;
      }

      const nextMode = (data.theme_mode as ThemeMode) || 'system';
      setModeState(nextMode);
      setColorState(clampHexColor(data.theme_color || DEFAULT_PRIMARY));
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = async (patch: Partial<{ theme_mode: ThemeMode; theme_color: string }>) => {
    if (!user) return;
    await supabase.from('profiles').update(patch).eq('id', user.id);
  };

  const setMode = async (next: ThemeMode) => {
    setModeState(next);
    await persist({ theme_mode: next });
  };

  const setColor = async (next: string) => {
    const v = clampHexColor(next);
    setColorState(v);
    await persist({ theme_color: v });
  };

  const colors = useMemo(() => {
    const isDark = resolvedScheme === 'dark';
    return {
      primary: color,
      background: isDark ? '#0B1220' : '#F9FAFB',
      card: isDark ? '#111827' : '#FFFFFF',
      text: isDark ? '#F9FAFB' : '#1F2937',
      border: isDark ? '#243044' : '#E5E7EB',
      mutedText: isDark ? '#9CA3AF' : '#6B7280',
      danger: '#EF4444',
    };
  }, [color, resolvedScheme]);

  const navigationTheme = useMemo(() => {
    const base = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [colors, resolvedScheme]);

  const value: ThemeContextValue = {
    mode,
    color,
    resolvedScheme,
    setMode,
    setColor,
    colors,
    navigationTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};


