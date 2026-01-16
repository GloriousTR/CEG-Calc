
import React from 'react';
import { ButtonType } from '../types';

interface CalculatorButtonProps {
  label: string;
  type?: ButtonType;
  onClick: () => void;
  className?: string;
  cols?: number;
}

import { Haptics, ImpactStyle } from '@capacitor/haptics';

const CalculatorButton: React.FC<CalculatorButtonProps> = ({
  label,
  type = ButtonType.Neutral,
  onClick,
  className = '',
  cols = 1
}) => {

  const handleClick = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Ignore errors on platforms where not supported
    }
    onClick();
  };

  // Changed h-14 to h-full to allow grid to control height
  // Changed rounded-lg to rounded-2xl for better aesthetics on taller buttons
  const baseClasses = "h-full w-full font-bold rounded-2xl shadow-btn active:shadow-btn-active active:scale-95 transition-all flex items-center justify-center select-none";

  let typeClasses = "";
  let textClasses = "text-xl";

  switch (type) {
    case ButtonType.Primary:
      typeClasses = "bg-primary hover:bg-red-500 text-white";
      textClasses = "text-sm uppercase tracking-wide";
      break;
    case ButtonType.Secondary:
      typeClasses = "bg-secondary hover:bg-yellow-300 text-gray-900";
      break;
    case ButtonType.Accent:
      typeClasses = "bg-accent hover:bg-teal-600 text-white";
      break;
    case ButtonType.Neutral:
      typeClasses = "bg-white dark:bg-surface hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-mono";
      break;
    case ButtonType.Memory:
      // Dark blue background for CEG logo as base
      typeClasses = "bg-[#0b2f7a] dark:bg-[#0b2f7a] border border-transparent dark:border-gray-800 pointer-events-none overflow-hidden relative";
      break;
  }

  if (type === ButtonType.Memory) {
    return (
      <div
        className={`col-span-${cols} ${baseClasses} ${typeClasses} ${className}`}
        style={{ gridColumn: cols > 1 ? `span ${cols} / span ${cols}` : undefined }}
      >
        <img
          src="https://i.hizliresim.com/9j58288.png"
          alt="CEG"
          crossOrigin="anonymous"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`col-span-${cols} ${baseClasses} ${typeClasses} ${textClasses} ${className}`}
      style={{ gridColumn: cols > 1 ? `span ${cols} / span ${cols}` : undefined }}
    >
      {label}
    </button>
  );
};

export default React.memo(CalculatorButton);
