
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
    isUnitless: true
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
      return b.feet === null && b.inch === null && b.yard === null && b.numerator === null && b.denominator === null;
  };

  // Handle number input (fills buffer)
  const handleNumber = (num: string) => {
    if (state.waitingForOperand) {
      // Starting a new number after an operator
      setState(prev => ({
        ...resetConversion(prev), // Reset conversion view if typing new number
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
        // Don't clear buffer or anything, just wait for unit key
    }));
  };

  // Unit keys commit the buffer OR trigger conversion
  const handleUnit = (unit: 'feet' | 'inch' | 'yard') => {
      // Check for conversion mode first
      if (state.isConversionMode) {
          setState(prev => {
             // If user selects same unit, cycle dimension (Linear -> SQ -> CB -> Linear)
             if (prev.convertedUnit === unit) {
                 const nextDim = (prev.convertedDimension % 3) + 1;
                 return {
                     ...prev,
                     convertedDimension: nextDim
                 };
             }

             // If we have active input/builder, we must convert that to decimal 
             // and set it as the current displayValue so the conversion has something to work on.
             // If no new input, we use the existing displayValue (calculated result).
             const hasNewInput = prev.builder.feet !== null || prev.builder.inch !== null || prev.builder.yard !== null || prev.builder.numerator !== null || prev.inputBuffer !== '';
             const valueToConvert = hasNewInput 
                ? convertBuilderToDecimal(prev.builder, prev.inputBuffer) 
                : prev.displayValue;
            
             return {
                ...prev,
                isConversionMode: false,
                convertedUnit: unit,
                convertedDimension: 1, // Reset to linear on first press
                displayValue: valueToConvert, // Commit the input
                builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 }, // Clear builder
                inputBuffer: '' // Clear buffer
             };
          });
          return;
      }

      // Normal Input Mode - A unit key was pressed, so we are NO LONGER unitless
      const val = parseFloat(state.inputBuffer || '0');
      
      setState(prev => {
          // Check if we should cycle dimension:
          // Criteria: Buffer is empty AND the unit we pressed is already set in the builder.
          const isCycling = prev.inputBuffer === '' && prev.builder[unit] !== null;

          if (isCycling) {
              const nextDim = (prev.builder.dimension % 3) + 1;
              return {
                  ...prev,
                  builder: {
                      ...prev.builder,
                      dimension: nextDim
                  },
                  isUnitless: false
              };
          }

          // Normal Entry Logic
          const newState = resetConversion(prev);
          const newBuilder = { ...newState.builder };
          
          // Special Logic: If we are building a fraction (numerator set, denominator null)
          // and we have a buffer, this unit press confirms the denominator.
          if (newBuilder.numerator !== null && newBuilder.denominator === null && state.inputBuffer !== '') {
             newBuilder.denominator = val;
          } else {
              // Standard assignment
              if (unit === 'feet') {
                  newBuilder.feet = val;
              } else if (unit === 'inch') {
                  newBuilder.inch = val;
              } else if (unit === 'yard') {
                  newBuilder.yard = val;
              }
          }
          
          return {
              ...newState,
              builder: newBuilder,
              inputBuffer: '', // Clear buffer after commit
              isUnitless: false // Explicitly set unitless to false
          };
      });
  };

  const handleFractionSlash = () => {
      // Commit buffer to numerator
      const val = parseInt(state.inputBuffer || '0');
      setState(prev => ({
          ...resetConversion(prev),
          builder: {
              ...prev.builder,
              numerator: val,
          },
          inputBuffer: '',
          isUnitless: false // Fractions imply units/dimensions usually, or at least break simple int/dec logic
      }));
  };

  // Backspace - Updated Logic with correct hierarchy
  const handleBackspace = () => {
      setState(prev => {
          // 1. If we have characters in the active input buffer, just delete the last one.
          if (prev.inputBuffer.length > 0) {
              return {
                  ...resetConversion(prev),
                  inputBuffer: prev.inputBuffer.slice(0, -1)
              };
          }

          // 2. If buffer is empty, we "undo" the last committed unit or fraction part.
          const b = { ...prev.builder };
          let newBuffer = '';
          
          if (b.denominator !== null) {
              newBuffer = b.denominator.toString();
              b.denominator = null;
          } else if (b.numerator !== null) {
               newBuffer = b.numerator.toString();
               b.numerator = null;
          } else if (b.inch !== null) {
              newBuffer = b.inch.toString();
              b.inch = null;
          } else if (b.feet !== null) {
              newBuffer = b.feet.toString();
              b.feet = null;
          } else if (b.yard !== null) {
              newBuffer = b.yard.toString();
              b.yard = null;
          }

          // If the builder is now completely empty, reset dimension to default (Linear)
          if (b.yard === null && b.feet === null && b.inch === null && b.numerator === null && b.denominator === null) {
              b.dimension = 1;
          }

          // Note: We don't necessarily reset isUnitless to true here because we might still be in a calculation chain
          // that had units. But for the builder itself, if it's empty, it's effectively unitless until a unit is re-added.

          return {
              ...resetConversion(prev),
              builder: b,
              inputBuffer: newBuffer
          };
      });
  };

  // Arithmetic Operators
  const handleOperator = (nextOperator: Operator) => {
    const hasNewInput = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
    const inputValue = hasNewInput ? convertBuilderToDecimal(state.builder, state.inputBuffer) : state.displayValue;
    
    // Determine if the current input (builder) is unitless
    const currentInputUnitless = isBuilderUnitless(state.builder);

    // Check if we are setting the first operand
    const isSettingFirstOperand = state.previousValue == null;

    if (isSettingFirstOperand) {
      // Capture the dimension of the operand we just built
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
        // The result is unitless ONLY if the input was unitless. 
        isUnitless: currentInputUnitless 
      }));
    } else if (state.operator) {
      // Perform pending calculation
      const result = performCalculation(state.operator, state.previousValue, inputValue);
      
      // The new result is unitless ONLY if BOTH the previous result and the current input are unitless.
      // e.g. 5 + 5 = 10 (Unitless)
      // 5 Feet + 5 = 10 Feet (Unitless = false)
      // 5 + 5 Feet = 10 Feet (Unitless = false)
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
      const currentValue = hasNewInput ? convertBuilderToDecimal(state.builder, state.inputBuffer) : state.displayValue;

      // Determine unitless status
      const currentInputUnitless = isBuilderUnitless(state.builder);
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
        isUnitless: true // Reset to unitless
      });
  };

  // Determine what to display:
  const isBuilding = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
  
  // When building, we show the construction buffer. 
  // When result is ready, we show the construction unit + optional secondary converted unit.
  const displayData = isBuilding 
      ? builderToDisplay(state.builder, state.inputBuffer)
      : formatConstructionUnit(state.displayValue, state.convertedUnit, state.convertedDimension, state.activeDimension, state.isUnitless);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 flex items-center justify-center h-full p-4 sm:p-8 select-none">
      <div className="w-full max-w-sm h-full max-h-[850px] bg-white dark:bg-[#1C2024] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        
        {/* Status Bar */}
        <div className="h-10 w-full flex justify-center items-center px-6 pt-3 pb-1 text-xl font-bold text-gray-400 dark:text-gray-500 z-10 tracking-wide">
          <span>CEG Calc</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-end p-6 pb-2 space-y-1">
          
          <Display value={displayData} onBackspace={handleBackspace} />

          {/* Keypad */}
          <div className="px-1 pb-4 pt-2">
            <div className="grid grid-cols-4 gap-3">
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
          </div>

          {/* Home Indicator */}
          <div className="h-1 w-1/3 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-3 opacity-50"></div>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-10 right-6 z-20">
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

      </div>
    </div>
  );
}
