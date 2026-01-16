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
            return {
                ...resetConversion(state),
                builder: { ...state.builder, numerator: val },
                inputBuffer: '',
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
                return {
                    ...resetConversion(state),
                    previousValue: inputValue,
                    waitingForOperand: true,
                    operator: nextOperator,
                    builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                    inputBuffer: '',
                    displayValue: inputValue,
                    activeDimension: currentDim,
                    isUnitless: currentInputUnitless
                };
            } else if (state.operator) {
                const result = performCalculation(state.operator, state.previousValue, inputValue);
                const newIsUnitless = state.isUnitless && currentInputUnitless;
                return {
                    ...resetConversion(state),
                    displayValue: result,
                    previousValue: result,
                    waitingForOperand: true,
                    operator: nextOperator,
                    builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                    inputBuffer: '',
                    isUnitless: newIsUnitless
                };
            }
            return state;
        }

        case CalculatorActionType.EQUAL: {
            if (!state.operator || state.previousValue === null) return state;

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

            return {
                ...resetConversion(state),
                displayValue: result,
                previousValue: null,
                operator: Operator.None,
                waitingForOperand: true,
                inputBuffer: '',
                builder: { feet: null, inch: null, yard: null, numerator: null, denominator: null, dimension: 1 },
                isUnitless: newIsUnitless
            };
        }

        case CalculatorActionType.CLEAR: {
            return initialCalculatorState;
        }

        default:
            return state;
    }
};
