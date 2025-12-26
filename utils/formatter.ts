
import { FormattedValue, BuilderState } from '../types';

// Helper to get dimension prefix
const getDimPrefix = (dim: number) => {
    if (dim === 2) return 'SQ ';
    if (dim === 3) return 'CB ';
    return '';
};

// Helper to convert decimal feet to Feet-Inch-Fraction AND generate secondary decimal string
export const formatConstructionUnit = (
    decimalFeet: number, 
    convertedUnit: 'feet' | 'inch' | 'yard' | null,
    convertedDimension: number = 1,
    primaryDimension: number = 1,
    isUnitless: boolean = false
): FormattedValue => {
  const isNegative = decimalFeet < 0;
  
  // If unitless, return simple decimal format
  if (isUnitless) {
      // Round to reasonable decimal places to avoid floating point ugliness (e.g. 2.50000001)
      const rawVal = parseFloat(Math.abs(decimalFeet).toFixed(4));
      return {
          feet: rawVal, // We use the 'feet' field to hold the main number
          inch: 0,
          numerator: 0,
          denominator: 0,
          isNegative,
          showFeetLabel: false,
          showInchLabel: false,
          showYardLabel: false,
          showDash: false,
          inputBuffer: '',
          secondaryDisplay: '',
          dimension: 1
      };
  }

  let absFeet = Math.abs(decimalFeet);
  
  // Floating point fix for very close rounding errors
  absFeet = parseFloat(absFeet.toFixed(6));

  const feet = Math.floor(absFeet);
  const remainingFeet = absFeet - feet;
  
  // Calculate Inches based on Primary Dimension
  // Linear: 12 inches per foot
  // Square: 144 sq inches per sq foot
  // Cubic: 1728 cu inches per cu foot
  const power = primaryDimension === 1 ? 1 : (primaryDimension === 2 ? 2 : 3);
  const inchFactor = Math.pow(12, power);
  
  const totalInches = remainingFeet * inchFactor;
  const wholeInches = Math.floor(totalInches + 0.0001); // Epsilon for float safety
  const remainingInches = totalInches - wholeInches;
  
  const precision = 16;
  const fractionalPart = Math.round(remainingInches * precision);
  
  let numerator = fractionalPart;
  let denominator = precision;
  
  // Simplify fraction
  while (numerator > 0 && numerator % 2 === 0 && denominator > 1) {
    numerator /= 2;
    denominator /= 2;
  }
  
  let finalInches = wholeInches;
  let finalFeet = feet;
  
  if (numerator === denominator) {
    finalInches += 1;
    numerator = 0;
    denominator = 0;
  }
  
  // Rollover logic also depends on dimension factor
  if (finalInches >= inchFactor) {
    finalFeet += 1;
    finalInches = 0;
  }

  // Calculate Secondary Display (Bottom Line)
  let secondaryDisplay = '';
  if (convertedUnit) {
      let val = decimalFeet;
      let unitLabel = '';
      
      const dimPrefix = getDimPrefix(convertedDimension);
      const convPower = convertedDimension === 1 ? 1 : (convertedDimension === 2 ? 2 : 3);

      if (convertedUnit === 'feet') {
          // Base unit is feet, no conversion needed for value if dimension matches base
          val = decimalFeet; 
          unitLabel = `${dimPrefix}FEET`;
      } else if (convertedUnit === 'inch') {
          val = decimalFeet * Math.pow(12, convPower);
          unitLabel = `${dimPrefix}INCH`;
      } else if (convertedUnit === 'yard') {
          val = decimalFeet / Math.pow(3, convPower);
          unitLabel = `${dimPrefix}YARD`;
      }
      
      // Formatting the decimal: remove trailing zeros, max 4 decimals
      const formattedNum = parseFloat(val.toFixed(5)); 
      secondaryDisplay = `${formattedNum} ${unitLabel}`;
  }

  return {
    feet: finalFeet,
    inch: finalInches,
    numerator: numerator > 0 ? numerator : 0,
    denominator: denominator > 1 ? denominator : 0,
    isNegative,
    showFeetLabel: true,
    showInchLabel: true,
    showYardLabel: false,
    showDash: true,
    inputBuffer: '',
    secondaryDisplay,
    dimension: primaryDimension // Use the tracked dimension for the main display
  };
};

export const builderToDisplay = (builder: BuilderState, buffer: string): FormattedValue => {
  // Determine where the buffer is "previewing"
  let previewFeet = builder.feet || 0;
  let previewInch = builder.inch || 0;
  let previewYard = builder.yard || 0;
  let previewNum = builder.numerator || 0;
  let previewDenom = builder.denominator || 0;

  // Visual logic mapping buffer to the active slot
  if (buffer) {
      const val = parseInt(buffer);
      if (builder.yard === null && builder.feet === null && builder.inch === null) {
          // No units set yet, ambiguous, but if we had to pick a slot to light up hypothetically...
          // We don't light up any label until unit is pressed.
      }
      // If we are typing a number, it doesn't immediately overwrite a set value unless that value is null.
      // But typically buffer implies "next value".
      
      // Logic: If last action was setting feet, buffer might be inches.
      if (builder.yard !== null) {
         // Yards set, waiting... usually construction calc doesn't mix Yards with Feet/Inches in same line often
         // But if it did:
         if (builder.feet === null) previewFeet = val;
      } else if (builder.feet !== null) {
          if (builder.inch === null) {
              previewInch = val;
          } else if (builder.numerator === null) {
              previewNum = val;
          } else {
              previewDenom = val;
          }
      } else {
         // Nothing set, typing first number (could be anything)
         // We usually display it in the main slot (feet position visually) but without label
         previewFeet = val;
      }
  }

  return {
      feet: previewFeet,
      inch: previewInch,
      numerator: previewNum,
      denominator: previewDenom,
      isNegative: false,
      showFeetLabel: builder.feet !== null,
      showInchLabel: builder.inch !== null,
      showYardLabel: builder.yard !== null,
      showDash: builder.feet !== null && (builder.inch !== null || (buffer !== '' && builder.yard === null)),
      inputBuffer: buffer,
      dimension: builder.dimension
  };
};

export const convertBuilderToDecimal = (b: BuilderState, buffer: string): number => {
    let val = 0;
    
    // Power factor based on dimension
    // 1 (Linear): 1
    // 2 (Square): 1
    // 3 (Cubic): 1
    // *The base unit of the calculator is FEET (linear, square, or cubic depending on context)*
    // When we add 1 Sq Yard, we convert to 9 Sq Feet.
    // When we add 1 Yard, we convert to 3 Feet.
    const power = b.dimension === 1 ? 1 : (b.dimension === 2 ? 2 : 3);

    // Yards to Feet
    if (b.yard !== null) {
        val += b.yard * Math.pow(3, power);
    }

    // Feet (Base)
    if (b.feet !== null) {
        val += b.feet;
    }

    // Inches to Feet
    if (b.inch !== null) {
        val += b.inch / Math.pow(12, power);
    }
    
    // Fraction (Inches) to Feet
    if (b.numerator !== null && b.denominator !== null && b.denominator !== 0) {
        val += (b.numerator / b.denominator) / Math.pow(12, power);
    }
    
    // Buffer handling (Ambiguous trailing number)
    if (buffer) {
        const buffVal = parseFloat(buffer);
        if (b.yard === null && b.feet === null && b.inch === null) {
             // Just a number, assume Feet (base)
             val += buffVal;
        }
        else if (b.yard !== null && b.feet === null) {
             // Yards set, buffer is Feet?
             val += buffVal; 
        }
        else if (b.feet !== null && b.inch === null) {
             // Feet set, buffer is Inches
             val += buffVal / Math.pow(12, power);
        }
        else if (b.numerator === null && b.inch !== null) {
            // Inch set, buffer is numerator
            // Ignore until denom? Or add as whole inches? 
            // Standard calc behavior: buffer is effectively ignored until unit pressed or operator.
            // But here we treat it as valid input for live calc.
            // Let's assume it's numerator for now, but without denom it's 0.
        }
        else if (b.denominator === null && b.numerator !== null) {
            // Denominator
            val += (b.numerator / buffVal) / Math.pow(12, power);
        }
    }
    return val;
};
