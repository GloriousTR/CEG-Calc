
import React, { useState, useEffect } from 'react';
import Display from './components/Display';
import CalculatorButton from './components/CalculatorButton';
import { ButtonType, Operator, CalculatorState, BuilderState } from './types';
import { formatConstructionUnit, builderToDisplay, convertBuilderToDecimal } from './utils/formatter';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  
  // Initial State
  const [state, setState] = useState<CalculatorState>({
    displayValue: 0,
    builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
    inputBuffer: '',
    operator: Operator.None,
    waitingForOperand: false,
    previousValue: null,
    memory: 0,
    isConversionMode: false,
    convertedUnit: null,
    convertedDimension: 1,
    activeDimension: 1,
    isUnitless: true,
    preferredUnit: 'feet' // Default to feet preference
  });

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const resetConversion = (prevState: CalculatorState) => ({
    ...prevState,
    isConversionMode: false,
    convertedUnit: null,
    convertedDimension: 1
  });

  // Helper to check if current builder has any units assigned
  const isBuilderUnitless = (b: BuilderState): boolean => {
      return b.feet === null && b.inch === null && b.yard === null;
  };

  // Handle number input (fills buffer)
  const handleNumber = (num: string) => {
    if (state.waitingForOperand) {
      setState(prev => ({
        ...resetConversion(prev),
        inputBuffer: num,
        builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
        waitingForOperand: false
      }));
    } else {
      setState(prev => ({
        ...resetConversion(prev),
        inputBuffer: prev.inputBuffer + num
      }));
    }
  };

  const handleDecimal = () => {
    if (state.waitingForOperand) {
      setState(prev => ({
        ...resetConversion(prev),
        inputBuffer: '0.',
        builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
        waitingForOperand: false
      }));
    } else {
      if (state.inputBuffer.includes('.')) return;
      const nextBuffer = state.inputBuffer === '' ? '0.' : '.';
      setState(prev => ({
        ...resetConversion(prev),
        inputBuffer: prev.inputBuffer + nextBuffer
      }));
    }
  };

  const handleConv = () => {
    setState(prev => ({
        ...prev,
        isConversionMode: true,
    }));
  };

  const handleUnit = (unit: 'feet' | 'inch' | 'yard') => {
      if (state.isConversionMode) {
          setState(prev => {
             if (prev.convertedUnit === unit) {
                 const nextDim = (prev.convertedDimension % 3) + 1;
                 return { ...prev, convertedDimension: nextDim };
             }
             const hasNewInput = prev.builder.feet !== null || prev.builder.inch !== null || prev.builder.yard !== null || prev.builder.numerator !== null || prev.inputBuffer !== '';
             
             const sourceDimension = hasNewInput ? prev.builder.dimension : prev.activeDimension;
             const sourceUnitless = hasNewInput ? isBuilderUnitless(prev.builder) : prev.isUnitless;

             const valueToConvert = hasNewInput 
                ? convertBuilderToDecimal(prev.builder, prev.inputBuffer) 
                : prev.displayValue;
            
             return {
                ...prev,
                isConversionMode: false,
                convertedUnit: unit,
                convertedDimension: sourceDimension,
                displayValue: valueToConvert,
                activeDimension: sourceDimension,
                builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                inputBuffer: '',
                isUnitless: sourceUnitless
             };
          });
          return;
      }

      const val = parseFloat(state.inputBuffer || '0');
      
      setState(prev => {
          const isCycling = prev.inputBuffer === '' && prev.builder[unit] !== null;

          if (isCycling) {
              const nextDim = (prev.builder.dimension % 3) + 1;
              return {
                  ...prev,
                  builder: { ...prev.builder, dimension: nextDim },
                  isUnitless: false,
                  preferredUnit: unit
              };
          }

          const newState = resetConversion(prev);
          const newBuilder = { ...newState.builder };
          
          if (newBuilder.numerator !== null && newBuilder.denominator === null && state.inputBuffer !== '') {
             newBuilder.denominator = val;
          } else {
              if (unit === 'feet') newBuilder.feet = val;
              else if (unit === 'inch') newBuilder.inch = val;
              else if (unit === 'yard') newBuilder.yard = val;
          }
          
          return {
              ...newState,
              builder: newBuilder,
              inputBuffer: '',
              isUnitless: false,
              preferredUnit: unit
          };
      });
  };

  const handleFractionSlash = () => {
      const val = parseInt(state.inputBuffer || '0');
      setState(prev => ({
          ...resetConversion(prev),
          builder: { ...prev.builder, numerator: val },
          inputBuffer: '',
      }));
  };

  const handleBackspace = () => {
      setState(prev => {
          if (prev.inputBuffer.length > 0) {
              return {
                  ...resetConversion(prev),
                  inputBuffer: prev.inputBuffer.slice(0, -1)
              };
          }
          const b = { ...prev.builder };
          let newBuffer = '';
          
          if (b.denominator !== null) { newBuffer = b.denominator.toString(); b.denominator = null; }
          else if (b.numerator !== null) { newBuffer = b.numerator.toString(); b.numerator = null; }
          else if (b.inch !== null) { newBuffer = b.inch.toString(); b.inch = null; }
          else if (b.feet !== null) { newBuffer = b.feet.toString(); b.feet = null; }
          else if (b.yard !== null) { newBuffer = b.yard.toString(); b.yard = null; }

          if (b.yard === null && b.feet === null && b.inch === null && b.numerator === null && b.denominator === null) {
              b.dimension = 1;
          }

          return { ...resetConversion(prev), builder: b, inputBuffer: newBuffer };
      });
  };

  const handleOperator = (nextOperator: Operator) => {
    const hasNewInput = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
    let inputValue = hasNewInput ? convertBuilderToDecimal(state.builder, state.inputBuffer) : state.displayValue;
    
    const currentInputUnitless = isBuilderUnitless(state.builder);

    if (!state.isUnitless && currentInputUnitless && hasNewInput) {
        const power = state.activeDimension === 1 ? 1 : (state.activeDimension === 2 ? 2 : 3);
        if (state.preferredUnit === 'inch') {
            inputValue = inputValue / Math.pow(12, power);
        } else if (state.preferredUnit === 'yard') {
            inputValue = inputValue * Math.pow(3, power);
        }
    }

    const isSettingFirstOperand = state.previousValue == null;

    if (isSettingFirstOperand) {
      const currentDim = state.builder.dimension; 
      setState(prev => ({
        ...resetConversion(prev),
        previousValue: inputValue,
        waitingForOperand: true,
        operator: nextOperator,
        builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
        inputBuffer: '',
        displayValue: inputValue, 
        activeDimension: currentDim,
        isUnitless: currentInputUnitless 
      }));
    } else if (state.operator) {
      const result = performCalculation(state.operator, state.previousValue, inputValue);
      const newIsUnitless = state.isUnitless && currentInputUnitless;
      setState(prev => ({
        ...resetConversion(prev),
        displayValue: result,
        previousValue: result,
        waitingForOperand: true,
        operator: nextOperator,
        builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
        inputBuffer: '',
        isUnitless: newIsUnitless
      }));
    }
  };

  const performCalculation = (op: Operator, prev: number, current: number) => {
    switch (op) {
      case Operator.Add: return prev + current;
      case Operator.Subtract: return prev - current;
      case Operator.Multiply: return prev * current;
      case Operator.Divide: return prev / current;
      default: return current;
    }
  };

  const handleEqual = () => {
      if (!state.operator || state.previousValue === null) return;
      
      const hasNewInput = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
      let currentValue = hasNewInput ? convertBuilderToDecimal(state.builder, state.inputBuffer) : state.displayValue;
      const currentInputUnitless = isBuilderUnitless(state.builder);
      
      if (!state.isUnitless && currentInputUnitless && hasNewInput) {
        const power = state.activeDimension === 1 ? 1 : (state.activeDimension === 2 ? 2 : 3);
        if (state.preferredUnit === 'inch') {
            currentValue = currentValue / Math.pow(12, power);
        } else if (state.preferredUnit === 'yard') {
            currentValue = currentValue * Math.pow(3, power);
        }
      }

      const newIsUnitless = state.isUnitless && currentInputUnitless;
      const result = performCalculation(state.operator, state.previousValue, currentValue);
      
      setState(prev => ({
          ...resetConversion(prev),
          displayValue: result,
          previousValue: null,
          operator: Operator.None,
          waitingForOperand: true,
          inputBuffer: '',
          builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
          isUnitless: newIsUnitless
      }));
  };

  const handleClear = () => {
      setState({
        displayValue: 0,
        inputBuffer: '',
        operator: Operator.None,
        waitingForOperand: false,
        previousValue: null,
        memory: state.memory,
        builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
        isConversionMode: false,
        convertedUnit: null,
        convertedDimension: 1,
        activeDimension: 1,
        isUnitless: true,
        preferredUnit: 'feet' 
      });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      if (/^[0-9]$/.test(key)) { e.preventDefault(); handleNumber(key); return; }
      if (key === '.' || key === ',') { e.preventDefault(); handleDecimal(); return; }
      if (key === '+') { e.preventDefault(); handleOperator(Operator.Add); return; }
      if (key === '-') { e.preventDefault(); handleOperator(Operator.Subtract); return; }
      if (key === '*' || key.toLowerCase() === 'x') { e.preventDefault(); handleOperator(Operator.Multiply); return; }
      if (code === 'NumpadDivide') { e.preventDefault(); handleOperator(Operator.Divide); return; }
      if (key === '/') { e.preventDefault(); handleFractionSlash(); return; }
      if (key === 'Enter' || key === '=') { e.preventDefault(); handleEqual(); return; }
      if (key === 'Backspace') { e.preventDefault(); handleBackspace(); return; }
      if (key === 'Escape' || key === 'Delete') { e.preventDefault(); handleClear(); return; }
      if (key.toLowerCase() === 'f') { e.preventDefault(); handleUnit('feet'); return; }
      if (key.toLowerCase() === 'i') { e.preventDefault(); handleUnit('inch'); return; }
      if (key.toLowerCase() === 'y') { e.preventDefault(); handleUnit('yard'); return; }
      if (key.toLowerCase() === 'c') { e.preventDefault(); handleConv(); return; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state]);

  const isBuilding = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
  const displayData = isBuilding 
      ? builderToDisplay(state.builder, state.inputBuffer)
      : formatConstructionUnit(state.displayValue, state.convertedUnit, state.convertedDimension, state.activeDimension, state.preferredUnit, state.isUnitless);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 flex items-center justify-center w-full h-full p-0 sm:p-6 md:p-8 select-none overflow-hidden">
      
      {/* 
        Main Container 
        Mobile: Full width/height (w-full h-full), no rounded corners initially.
        Desktop (md): Rounded corners, Fixed aspect ratio or size, Flex Row (Left Display, Right Keypad).
      */}
      <div className="w-full h-full sm:h-auto sm:max-h-[900px] sm:max-w-md md:max-w-5xl md:max-h-[600px] bg-white dark:bg-[#1C2024] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative border-0 sm:border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        
        {/* --- LEFT SECTION (Display) --- */}
        {/* On Mobile: Top part. On Desktop: Left part. */}
        <div className="flex-1 flex flex-col p-6 md:p-8 md:w-[55%] z-10 relative bg-white dark:bg-[#1C2024] transition-colors duration-300">
            {/* Header: Title + Theme Toggle */}
            <div className="flex justify-between items-center mb-2 md:mb-6">
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
            <div className="flex-1 flex flex-col justify-end md:justify-center">
                <Display value={displayData} onBackspace={handleBackspace} />
            </div>
        </div>

        {/* --- RIGHT SECTION (Keypad) --- */}
        {/* On Mobile: Bottom part. On Desktop: Right part. */}
        <div className="bg-gray-50 dark:bg-[#16181b] md:bg-transparent md:dark:bg-transparent px-4 pb-6 pt-4 md:p-8 md:w-[45%] flex flex-col justify-end md:justify-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-sm mx-auto md:max-w-none w-full">
              <CalculatorButton label="Conv" type={state.isConversionMode ? ButtonType.Accent : ButtonType.Primary} onClick={handleConv} />
              <CalculatorButton label="Yard" type={ButtonType.Primary} onClick={() => handleUnit('yard')} />
              <CalculatorButton label="Feet" type={ButtonType.Primary} onClick={() => handleUnit('feet')} />
              <CalculatorButton label="Inch" type={ButtonType.Primary} onClick={() => handleUnit('inch')} />
              
              <CalculatorButton label="Clear" type={ButtonType.Primary} onClick={handleClear} />
              <CalculatorButton label={`MEM`} type={ButtonType.Memory} cols={2} onClick={() => {}} />
              <CalculatorButton label="/" type={ButtonType.Primary} onClick={handleFractionSlash} className="font-mono text-xl" />
              
              <CalculatorButton label="÷" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Divide)} className="text-2xl" />
              <CalculatorButton label="7" onClick={() => handleNumber('7')} />
              <CalculatorButton label="8" onClick={() => handleNumber('8')} />
              <CalculatorButton label="9" onClick={() => handleNumber('9')} />
              
              <CalculatorButton label="×" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Multiply)} className="text-2xl" />
              <CalculatorButton label="4" onClick={() => handleNumber('4')} />
              <CalculatorButton label="5" onClick={() => handleNumber('5')} />
              <CalculatorButton label="6" onClick={() => handleNumber('6')} />
              
              <CalculatorButton label="−" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Subtract)} className="text-2xl" />
              <CalculatorButton label="1" onClick={() => handleNumber('1')} />
              <CalculatorButton label="2" onClick={() => handleNumber('2')} />
              <CalculatorButton label="3" onClick={() => handleNumber('3')} />
              
              <CalculatorButton label="+" type={ButtonType.Secondary} onClick={() => handleOperator(Operator.Add)} className="text-2xl" />
              <CalculatorButton label="." type={ButtonType.Neutral} onClick={handleDecimal} className="text-2xl pb-2" />
              <CalculatorButton label="0" onClick={() => handleNumber('0')} />
              <CalculatorButton label="=" type={ButtonType.Accent} onClick={handleEqual} className="text-2xl" />
            </div>

            {/* Home Indicator (Mobile Only) */}
            <div className="md:hidden h-1 w-1/3 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mt-6 opacity-50"></div>
        </div>

      </div>
    </div>
  );
}
