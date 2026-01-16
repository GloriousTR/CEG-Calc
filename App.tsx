
import React, { useState, useEffect, useReducer, useCallback } from 'react';
import Display from './components/Display';
import CalculatorButton from './components/CalculatorButton';
import { ButtonType, Operator } from './types';
import { formatConstructionUnit, builderToDisplay } from './utils/formatter';
import { calculatorReducer, initialCalculatorState, CalculatorActionType } from './utils/calculatorReducer';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handlers wrapped in useCallback for stable references
  const handleNumber = useCallback((num: string) => {
    dispatch({ type: CalculatorActionType.NUMBER, payload: num });
  }, []);

  const handleDecimal = useCallback(() => {
    dispatch({ type: CalculatorActionType.DECIMAL });
  }, []);

  const handleConv = useCallback(() => {
    dispatch({ type: CalculatorActionType.CONVERSION });
  }, []);

  const handleUnit = useCallback((unit: 'feet' | 'inch' | 'yard') => {
    dispatch({ type: CalculatorActionType.UNIT, payload: unit });
  }, []);

  const handleFractionSlash = useCallback(() => {
    dispatch({ type: CalculatorActionType.FRACTION });
  }, []);

  const handleBackspace = useCallback(() => {
    dispatch({ type: CalculatorActionType.BACKSPACE });
  }, []);

  const handleOperator = useCallback((op: Operator) => {
    // Only used for visual buttons, keydown handles mapping separately? 
    // Actually keydown should use the same dispatch.
    dispatch({ type: CalculatorActionType.OPERATOR, payload: op });
  }, []);

  const handleEqual = useCallback(() => {
    dispatch({ type: CalculatorActionType.EQUAL });
  }, []);

  const handleClear = useCallback(() => {
    dispatch({ type: CalculatorActionType.CLEAR });
  }, []);

  // Keyboard Event Listener
  // Optimized: depends ONLY on dispatch, which is stable. 
  // Should NOT re-attach on every state change.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      if (/^[0-9]$/.test(key)) { e.preventDefault(); dispatch({ type: CalculatorActionType.NUMBER, payload: key }); return; }
      if (key === '.' || key === ',') { e.preventDefault(); dispatch({ type: CalculatorActionType.DECIMAL }); return; }
      if (key === '+') { e.preventDefault(); dispatch({ type: CalculatorActionType.OPERATOR, payload: Operator.Add }); return; }
      if (key === '-') { e.preventDefault(); dispatch({ type: CalculatorActionType.OPERATOR, payload: Operator.Subtract }); return; }
      if (key === '*' || key.toLowerCase() === 'x') { e.preventDefault(); dispatch({ type: CalculatorActionType.OPERATOR, payload: Operator.Multiply }); return; }
      if (code === 'NumpadDivide') { e.preventDefault(); dispatch({ type: CalculatorActionType.OPERATOR, payload: Operator.Divide }); return; }
      if (key === '/') { e.preventDefault(); dispatch({ type: CalculatorActionType.FRACTION }); return; }
      if (key === 'Enter' || key === '=') { e.preventDefault(); dispatch({ type: CalculatorActionType.EQUAL }); return; }
      if (key === 'Backspace') { e.preventDefault(); dispatch({ type: CalculatorActionType.BACKSPACE }); return; }
      if (key === 'Escape' || key === 'Delete') { e.preventDefault(); dispatch({ type: CalculatorActionType.CLEAR }); return; }
      if (key.toLowerCase() === 'f') { e.preventDefault(); dispatch({ type: CalculatorActionType.UNIT, payload: 'feet' }); return; }
      if (key.toLowerCase() === 'i') { e.preventDefault(); dispatch({ type: CalculatorActionType.UNIT, payload: 'inch' }); return; }
      if (key.toLowerCase() === 'y') { e.preventDefault(); dispatch({ type: CalculatorActionType.UNIT, payload: 'yard' }); return; }
      if (key.toLowerCase() === 'c') { e.preventDefault(); dispatch({ type: CalculatorActionType.CONVERSION }); return; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array as dispatch is stable

  const isBuilding = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
  const displayData = isBuilding
    ? builderToDisplay(state.builder, state.inputBuffer)
    : formatConstructionUnit(state.displayValue, state.convertedUnit, state.convertedDimension, state.activeDimension, state.preferredUnit, state.isUnitless);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 flex items-center justify-center w-full h-full sm:min-h-screen p-0 sm:p-6 md:p-8 select-none overflow-hidden fixed inset-0">

      {/* 
        Main Container 
      */}
      <div className="w-full h-[100dvh] sm:h-[850px] sm:max-h-[90dvh] sm:max-w-md md:max-w-5xl md:h-auto md:aspect-[2/1] bg-white dark:bg-[#1C2024] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative border-0 sm:border border-gray-200 dark:border-gray-800 transition-colors duration-300">

        {/* --- LEFT SECTION (Display) --- */}
        <div className="flex-[4] md:flex-[4.5] flex flex-col p-6 pt-8 md:p-8 z-10 relative bg-white dark:bg-[#1C2024] transition-colors duration-300">
          {/* Header: Title + Theme Toggle */}
          <div className="flex justify-between items-center mb-1 md:mb-6 shrink-0">
            <div className="text-xl font-bold text-gray-400 dark:text-gray-500 tracking-wide">
              CEG Calc
            </div>
            <button
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors shadow-sm"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>

          {/* Display Component */}
          <div className="flex-1 flex flex-col justify-end md:justify-center overflow-hidden min-h-0">
            <Display value={displayData} onBackspace={handleBackspace} />
          </div>
        </div>

        {/* --- RIGHT SECTION (Keypad) --- */}
        <div className="flex-[6] md:flex-[5.5] bg-gray-50 dark:bg-[#16181b] md:bg-transparent md:dark:bg-transparent px-3 pb-4 pt-2 md:p-8 flex flex-col border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 min-h-0">
          {/* Grid Container - Fills available height */}
          <div className="flex-1 w-full min-h-0">
            <div className="grid grid-cols-4 grid-rows-6 gap-2 md:gap-4 w-full h-full">
              <CalculatorButton label="Conv" type={state.isConversionMode ? ButtonType.Accent : ButtonType.Primary} onClick={handleConv} />
              <CalculatorButton label="Yard" type={ButtonType.Primary} onClick={() => handleUnit('yard')} />
              <CalculatorButton label="Feet" type={ButtonType.Primary} onClick={() => handleUnit('feet')} />
              <CalculatorButton label="Inch" type={ButtonType.Primary} onClick={() => handleUnit('inch')} />

              <CalculatorButton label="Clear" type={ButtonType.Primary} onClick={handleClear} />
              <CalculatorButton label={`MEM`} type={ButtonType.Memory} cols={2} onClick={() => { }} />
              <CalculatorButton label="/" type={ButtonType.Primary} onClick={handleFractionSlash} className="font-mono text-xl" />

              <CalculatorButton label="÷" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Divide)} className="text-2xl" />
              <CalculatorButton label="7" onClick={() => handleNumber('7')} className="text-3xl" />
              <CalculatorButton label="8" onClick={() => handleNumber('8')} className="text-3xl" />
              <CalculatorButton label="9" onClick={() => handleNumber('9')} className="text-3xl" />

              <CalculatorButton label="×" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Multiply)} className="text-2xl" />
              <CalculatorButton label="4" onClick={() => handleNumber('4')} className="text-3xl" />
              <CalculatorButton label="5" onClick={() => handleNumber('5')} className="text-3xl" />
              <CalculatorButton label="6" onClick={() => handleNumber('6')} className="text-3xl" />

              <CalculatorButton label="−" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Subtract)} className="text-2xl" />
              <CalculatorButton label="1" onClick={() => handleNumber('1')} className="text-3xl" />
              <CalculatorButton label="2" onClick={() => handleNumber('2')} className="text-3xl" />
              <CalculatorButton label="3" onClick={() => handleNumber('3')} className="text-3xl" />

              <CalculatorButton label="+" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Add)} className="text-2xl" />
              <CalculatorButton label="." type={ButtonType.Neutral} onClick={handleDecimal} className="text-3xl pb-2" />
              <CalculatorButton label="0" onClick={() => handleNumber('0')} className="text-3xl" />
              <CalculatorButton label="=" type={ButtonType.Accent} onClick={handleEqual} className="text-3xl" />
            </div>
          </div>

          {/* Home Indicator (Mobile Only) */}
          <div className="md:hidden h-1 w-1/3 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-2 shrink-0 opacity-50"></div>
        </div>

      </div>
    </div>
  );
}
