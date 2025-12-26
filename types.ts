
export enum ButtonType {
  Primary = 'primary', // Red
  Secondary = 'secondary', // Yellow
  Accent = 'accent', // Teal
  Neutral = 'neutral', // White/Dark
  Memory = 'memory' // Special display
}

export interface FormattedValue {
  feet: number;
  inch: number;
  numerator: number;
  denominator: number;
  isNegative: boolean;
  // Visual helpers for the input mode
  showFeetLabel: boolean;
  showInchLabel: boolean;
  showYardLabel: boolean; // Added Yard
  showDash: boolean;
  inputBuffer: string; // To show what is currently being typed (ghosted or active)
  secondaryDisplay?: string; // The bottom line (e.g., "20.125 INCH")
  dimension: number; // 1 = Linear, 2 = Square (SQ), 3 = Cubic (CB)
}

export enum Operator {
  Add = '+',
  Subtract = '-',
  Multiply = '*',
  Divide = '÷',
  None = ''
}

export interface BuilderState {
  feet: number | null;
  inch: number | null;
  yard: number | null; // Added Yard support
  numerator: number | null;
  denominator: number | null;
  dimension: number; // 1, 2, or 3
}

export interface CalculatorState {
  displayValue: number; // The calculated result (decimal feet)
  builder: BuilderState; // The current value being typed
  inputBuffer: string; // The raw numbers being typed before pressing a unit
  operator: Operator;
  waitingForOperand: boolean; // True if we just hit +, -, *, /
  previousValue: number | null;
  memory: number;
  isConversionMode: boolean; // True after pressing 'Conv'
  convertedUnit: 'feet' | 'inch' | 'yard' | null; // The unit to display the result in
  convertedDimension: number; // 1, 2, or 3 for the converted unit
  activeDimension: number; // The dimension of the current result (1, 2, or 3)
  isUnitless: boolean; // NEW: True if the current result has no specific unit assigned (pure math)
}
