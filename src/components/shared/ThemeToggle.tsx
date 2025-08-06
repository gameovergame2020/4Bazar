
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = "", 
  showLabels = false 
}) => {
  const { theme, setTheme, isDark, roleColors } = useTheme();
  const { userData } = useAuth();

  const currentRole = userData?.role || 'customer';
  const roleGradient = isDark ? roleColors[currentRole]?.dark : roleColors[currentRole]?.light;

  const options = [
    { value: 'light', icon: Sun, label: 'Yorug\'', active: theme === 'light' },
    { value: 'dark', icon: Moon, label: 'Qorong\'u', active: theme === 'dark' },
    { value: 'auto', icon: Monitor, label: 'Avtomatik', active: theme === 'auto' }
  ];

  if (showLabels) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tema rejimi
        </label>
        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value as any)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                  option.active
                    ? `bg-gradient-to-br ${roleGradient} text-white border-transparent shadow-lg`
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <IconComponent size={20} />
                <span className="text-xs mt-1 font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 ${className}`}>
      {options.map((option) => {
        const IconComponent = option.icon;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value as any)}
            className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 ${
              option.active
                ? `bg-gradient-to-br ${roleGradient} text-white shadow-sm`
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            title={option.label}
          >
            <IconComponent size={16} />
          </button>
        );
      })}
    </div>
  );
};
