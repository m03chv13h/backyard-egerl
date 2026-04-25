import { useTheme, type ThemeName } from '../context/ThemeContext';

const themes: { value: ThemeName; label: string; icon: string }[] = [
  { value: 'retro', label: 'Retro CRT', icon: '🖥️' },
  { value: 'tetris', label: 'Tetris', icon: '🧱' },
  { value: 'mario', label: 'Mario', icon: '🍄' },
  { value: 'luigi', label: 'Luigi', icon: '🟢' },
  { value: 'peach', label: 'Peach', icon: '🍑' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher">
      {themes.map((t) => (
        <button
          key={t.value}
          className={`theme-btn ${theme === t.value ? 'active' : ''}`}
          onClick={() => setTheme(t.value)}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
