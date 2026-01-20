import { CalculatorState, Operator, BuilderState } from '../types';
import { convertBuilderToDecimal } from './formatter';

// Actions
export enum CalculatorActionType {
    NUMBER = 'NUMBER',
    DECIMAL = 'DECIMAL',
    OPERATOR = 'OPERATOR',
    EQUAL = 'EQUAL',
    CLEAR = 'CLEAR',
    BACKSPACE = 'BACKSPACE',
    CONVERSION = 'CONVERSION',
    UNIT = 'UNIT',
    FRACTION = 'FRACTION',
}

export type CalculatorAction =
    | { type: CalculatorActionType.NUMBER; payload: string }
    | { type: CalculatorActionType.DECIMAL }
    | { type: CalculatorActionType.OPERATOR; payload: Operator }
    | { type: CalculatorActionType.EQUAL }
    | { type: CalculatorActionType.CLEAR }
    | { type: CalculatorActionType.BACKSPACE }
    | { type: CalculatorActionType.CONVERSION }
    | { type: CalculatorActionType.UNIT; payload: 'feet' | 'inch' | 'yard' }
    | { type: CalculatorActionType.FRACTION };

// Initial State
export const initialCalculatorState: CalculatorState = {
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
    preferredUnit: 'feet'
};

// Helpers
const resetConversion = (prevState: CalculatorState): CalculatorState => ({
    ...prevState,
    isConversionMode: false,
    convertedUnit: null,
    convertedDimension: 1
});

const isBuilderUnitless = (b: BuilderState): boolean => {
    return b.feet === null && b.inch === null && b.yard === null;
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

export const calculatorReducer = (state: CalculatorState, action: CalculatorAction): CalculatorState => {
    switch (action.type) {
        case CalculatorActionType.NUMBER: {
            const num = action.payload;
            if (state.waitingForOperand) {
                return {
                    ...resetConversion(state),
                    inputBuffer: num,
                    builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                    waitingForOperand: false
                };
            } else {
                return {
                    ...resetConversion(state),
                    inputBuffer: state.inputBuffer + num
                };
            }
        }

        case CalculatorActionType.DECIMAL: {
            if (state.waitingForOperand) {
                return {
                    ...resetConversion(state),
                    inputBuffer: '0.',
                    builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                    waitingForOperand: false
                };
            } else {
                if (state.inputBuffer.includes('.')) return state;
                const nextBuffer = state.inputBuffer === '' ? '0.' : '.';
                return {
                    ...resetConversion(state),
                    inputBuffer: state.inputBuffer + nextBuffer
                };
            }
        }

        case CalculatorActionType.CONVERSION: {
            return {
                ...state,
                isConversionMode: true,
            };
        }

        case CalculatorActionType.UNIT: {
            const unit = action.payload;
            if (state.isConversionMode) {
                if (state.convertedUnit === unit) {
                    const nextDim = (state.convertedDimension % 3) + 1;
                    return { ...state, convertedDimension: nextDim };
                }
                const hasNewInput = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';

                const sourceDimension = hasNewInput ? state.builder.dimension : state.activeDimension;
                const sourceUnitless = hasNewInput ? isBuilderUnitless(state.builder) : state.isUnitless;

                const valueToConvert = hasNewInput
                    ? convertBuilderToDecimal(state.builder, state.inputBuffer)
                    : state.displayValue;

                return {
                    ...state,
                    isConversionMode: false,
                    convertedUnit: unit,
                    convertedDimension: sourceDimension,
                    displayValue: valueToConvert,
                    activeDimension: sourceDimension,
                    builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                    inputBuffer: '',
                    isUnitless: sourceUnitless
                };
            }

            // Normal Unit Assignment
            const val = parseFloat(state.inputBuffer || '0');

            const isCycling = state.inputBuffer === '' && state.builder[unit] !== null;

            if (isCycling) {
                const nextDim = (state.builder.dimension % 3) + 1;
                return {
                    ...state,
                    builder: { ...state.builder, dimension: nextDim },
                    isUnitless: false,
                    preferredUnit: unit
                };
            }

            const newState = resetConversion(state);
            const newBuilder = { ...newState.builder };

            if (newBuilder.numerator !== null && newBuilder.denominator === null && state.inputBuffer !== '') {
                newBuilder.denominator = val;

                // CRITICAL FIX: If we just completed a fraction (e.g. 1/4) and unit is INCH,
                // but we have no whole inches set, explicitly set inch to 0.
                // This ensures isBuilderUnitless returns FALSE, so the result is treated as a dimensioned value.
                if (unit === 'inch' && newBuilder.inch === null && newBuilder.feet === null && newBuilder.yard === null) {
                    newBuilder.inch = 0;
                }
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
        }

        case CalculatorActionType.FRACTION: {
            const val = parseInt(state.inputBuffer || '0');

            // If starting a fraction and no units are defined, default to INCH (User preference)
            // CRITICAL: Also set builder.inch = 0 to mark this as a DIMENSIONED value
            // This ensures that 1/2 is treated as "0 INCH 1/2" (0.0416 feet) not as pure decimal 0.5
            let newPreferredUnit = state.preferredUnit;
            let newBuilder = { ...state.builder, numerator: val };

            const hasUnits = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null;
            if (!hasUnits && state.preferredUnit === 'feet') {
                newPreferredUnit = 'inch';
                // Set inch = 0 so isBuilderUnitless returns FALSE
                // This is the key fix - fractions default to INCH dimension
                newBuilder.inch = 0;
            }

            return {
                ...resetConversion(state),
                builder: newBuilder,
                inputBuffer: '',
                preferredUnit: newPreferredUnit
            };
        }

        case CalculatorActionType.BACKSPACE: {
            if (state.inputBuffer.length > 0) {
                return {
                    ...resetConversion(state),
                    inputBuffer: state.inputBuffer.slice(0, -1)
                };
            }
            const b = { ...state.builder };
            let newBuffer = '';

            if (b.denominator !== null) { newBuffer = b.denominator.toString(); b.denominator = null; }
            else if (b.numerator !== null) { newBuffer = b.numerator.toString(); b.numerator = null; }
            else if (b.inch !== null) { newBuffer = b.inch.toString(); b.inch = null; }
            else if (b.feet !== null) { newBuffer = b.feet.toString(); b.feet = null; }
            else if (b.yard !== null) { newBuffer = b.yard.toString(); b.yard = null; }

            if (b.yard === null && b.feet === null && b.inch === null && b.numerator === null && b.denominator === null) {
                b.dimension = 1;
            }

            return { ...resetConversion(state), builder: b, inputBuffer: newBuffer };
        }

        case CalculatorActionType.OPERATOR: {
            const nextOperator = action.payload;
            const hasNewInput = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
            let inputValue = hasNewInput ? convertBuilderToDecimal(state.builder, state.inputBuffer) : state.displayValue;

            const currentInputUnitless = isBuilderUnitless(state.builder);

            if (!state.isUnitless && currentInputUnitless && hasNewInput) {
                // IMPLICIT UNIT CONVERSION
                // Only converting "2" -> "2 inches" for Add/Subtract.
                // For Multiply/Divide, "2" must remain a SCALAR.
                const isScalarOp = nextOperator === Operator.Multiply || nextOperator === Operator.Divide;

                if (!isScalarOp) {
                    const power = state.activeDimension === 1 ? 1 : (state.activeDimension === 2 ? 2 : 3);
                    if (state.preferredUnit === 'inch') {
                        inputValue = inputValue / Math.pow(12, power);
                    } else if (state.preferredUnit === 'yard') {
                        inputValue = inputValue * Math.pow(3, power);
                    }
                }
            }

            const isSettingFirstOperand = state.previousValue == null;

            if (isSettingFirstOperand) {
                // BUG FIX: If we are using the result of a previous calculation (hasNewInput is FALSE),
                // we must preserve the dimension of that result (activeDimension), 
                // NOT the builder dimension (which is reset to 1).
                const currentDim = hasNewInput ? state.builder.dimension : state.activeDimension;

                // CRITICAL FIX: Also preserve isUnitless from previous result when no new input
                // Otherwise, pressing × after 4 INCH 1/2 result would incorrectly show 0.375 (unitless)
                const effectiveIsUnitless = hasNewInput ? currentInputUnitless : state.isUnitless;

                return {
                    ...resetConversion(state),
                    previousValue: inputValue,
                    waitingForOperand: true,
                    operator: nextOperator,
                    builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                    inputBuffer: '',
                    displayValue: inputValue,
                    activeDimension: currentDim,
                    isUnitless: effectiveIsUnitless
                };
            } else if (state.operator) {
                const result = performCalculation(state.operator, state.previousValue, inputValue);
                const newIsUnitless = state.isUnitless && currentInputUnitless;

                // DIMENSION ARITHMETIC for chained operations
                const currentInputDim = state.builder.dimension;
                const prevEffectiveDim = state.isUnitless ? 0 : state.activeDimension;
                const currentEffectiveDim = currentInputUnitless ? 0 : currentInputDim;

                let resultDim = state.activeDimension;
                if (state.operator === Operator.Multiply) {
                    resultDim = prevEffectiveDim + currentEffectiveDim;
                } else if (state.operator === Operator.Divide) {
                    resultDim = prevEffectiveDim - currentEffectiveDim;
                }
                resultDim = Math.min(3, Math.max(1, resultDim));

                return {
                    ...resetConversion(state),
                    displayValue: result,
                    previousValue: result,
                    waitingForOperand: true,
                    operator: nextOperator,
                    builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                    inputBuffer: '',
                    isUnitless: newIsUnitless,
                    activeDimension: resultDim
                };
            }
            return state;
        }

        case CalculatorActionType.EQUAL: {
            if (!state.operator || state.previousValue === null) return state;

            const hasNewInput = state.builder.feet !== null || state.builder.inch !== null || state.builder.yard !== null || state.builder.numerator !== null || state.inputBuffer !== '';
            let currentValue = hasNewInput ? convertBuilderToDecimal(state.builder, state.inputBuffer) : state.displayValue;
            const currentInputUnitless = isBuilderUnitless(state.builder);
            const currentInputDim = hasNewInput ? state.builder.dimension : state.activeDimension;

            if (!state.isUnitless && currentInputUnitless && hasNewInput) {
                // IMPLICIT UNIT CONVERSION
                // Only converting "2" -> "2 inches" for Add/Subtract.
                // For Multiply/Divide, "2" must remain a SCALAR.
                const isScalarOp = state.operator === Operator.Multiply || state.operator === Operator.Divide;

                if (!isScalarOp) {
                    const power = state.activeDimension === 1 ? 1 : (state.activeDimension === 2 ? 2 : 3);
                    if (state.preferredUnit === 'inch') {
                        currentValue = currentValue / Math.pow(12, power);
                    } else if (state.preferredUnit === 'yard') {
                        currentValue = currentValue * Math.pow(3, power);
                    }
                }
            }

            const newIsUnitless = state.isUnitless && currentInputUnitless;
            const result = performCalculation(state.operator, state.previousValue, currentValue);

            // DIMENSION ARITHMETIC: Calculate result dimension based on operation
            // For unitless values, treat dimension as 0 in calculations
            const prevEffectiveDim = state.isUnitless ? 0 : state.activeDimension;
            const currentEffectiveDim = currentInputUnitless ? 0 : currentInputDim;

            let resultDim = state.activeDimension; // Default to prev dimension

            if (state.operator === Operator.Multiply) {
                // Area × Length = Volume (2 + 1 = 3)
                // Linear × Linear = Area (1 + 1 = 2)
                resultDim = prevEffectiveDim + currentEffectiveDim;
            } else if (state.operator === Operator.Divide) {
                // Volume ÷ Length = Area (3 - 1 = 2)
                // Area ÷ Length = Linear (2 - 1 = 1)
                resultDim = prevEffectiveDim - currentEffectiveDim;
            }
            // For Add/Subtract, dimension stays the same as the first operand

            // Clamp to valid range [1, 3], treat 0 as 1 (linear)
            resultDim = Math.min(3, Math.max(1, resultDim));

            // AUTO-CONVERSION LOGIC
            let autoConvertedUnit: 'feet' | 'inch' | 'yard' | null = null;

            if (resultDim === 2) {
                // AREA: Default to Sq Feet unless inputs were specifically Inch or Yard
                // If user did Inch x Inch = Sq Inch
                // If user did Feet x Feet = Sq Feet
                // If mixed or otherwise = Sq Feet (Construction Standard)
                if (state.preferredUnit === 'inch' && state.builder.inch !== null) {
                    autoConvertedUnit = 'inch';
                } else if (state.preferredUnit === 'yard' && state.builder.yard !== null) {
                    autoConvertedUnit = 'yard';
                } else {
                    autoConvertedUnit = 'feet'; // Default Area unit
                }
            } else if (resultDim === 3) {
                // VOLUME: User explicitly requested "Sq feet x inch = cubic yard"
                // Construction standard is often Cubic Yards for volume (concrete etc)
                autoConvertedUnit = 'yard';
            }

            return {
                ...resetConversion(state), // First reset
                displayValue: result,
                previousValue: null,
                operator: Operator.None,
                waitingForOperand: true,
                inputBuffer: '',
                builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                isUnitless: newIsUnitless,
                activeDimension: resultDim,
                // Apply auto-conversion if valid unit is found, otherwise null (displays as preferred/default)
                convertedUnit: autoConvertedUnit,
                convertedDimension: resultDim,
                isConversionMode: !!autoConvertedUnit,
                preferredUnit: autoConvertedUnit || state.preferredUnit
            };
        }

        case CalculatorActionType.CLEAR: {
            return initialCalculatorState;
        }

        default:
            return state;
    }
};
