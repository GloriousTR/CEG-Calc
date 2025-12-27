
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
    preferredUnit: 'feet' | 'inch' | 'yard' = 'feet', // ADDED: preference logic
    isUnitless: boolean = false
): FormattedValue => {
  const isNegative = decimalFeet < 0;
  
  // If unitless, we want to show the raw Decimal number (Standard Math Mode)
  // We do NOT want to force fractions (e.g. 0.5 becoming 1/2) unless explicitly in a unit mode.
  if (isUnitless) {
      // Keep precision manageable but standard for display
      const val = parseFloat(decimalFeet.toFixed(6));
      
      return {
          yard: 0,
          feet: val, // Pass the full signed decimal value here
          inch: 0,
          numerator: 0,
          denominator: 0,
          isNegative: false, // Set false because sign is included in 'feet' value for simple display
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

  // --- Logic to extract Yards if Preferred ---
  let finalYards = 0;
  let remainingFeetForCalc = absFeet;

  // Calculate power based on dimension for unit conversions
  const dimPower = primaryDimension === 1 ? 1 : (primaryDimension === 2 ? 2 : 3);
  const feetPerYard = Math.pow(3, dimPower);

  let showYardLabel = false;

  if (preferredUnit === 'yard') {
      const totalYards = absFeet / feetPerYard;
      finalYards = Math.floor(totalYards + 0.0001);
      
      if (finalYards > 0 || (finalYards === 0 && totalYards < 1)) {
          showYardLabel = true;
          remainingFeetForCalc = absFeet - (finalYards * feetPerYard);
      }
  }

  // --- Logic to extract Feet/Inch from remaining ---
  const feet = Math.floor(remainingFeetForCalc + 0.0001);
  const remainingFeet = remainingFeetForCalc - feet;
  
  const inchFactor = Math.pow(12, dimPower);
  
  const totalInches = remainingFeet * inchFactor;
  const wholeInches = Math.floor(totalInches + 0.0001); // Epsilon for float safety
  const remainingInches = totalInches - wholeInches;
  
  // INCREASED PRECISION: Using 64 to avoid rounding errors like 5/64 when 3/16 is expected
  const precision = 64; 
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

  // Double check yard rollover if we just bumped feet up to a whole yard equivalent
  if (preferredUnit === 'yard' && finalFeet >= feetPerYard) {
      finalYards += 1;
      finalFeet = 0;
  }

  // Calculate Secondary Display (Bottom Line)
  let secondaryDisplay = '';
  if (convertedUnit) {
      let val = decimalFeet;
      let unitLabel = '';
      
      const dimPrefix = getDimPrefix(convertedDimension);
      const convPower = convertedDimension === 1 ? 1 : (convertedDimension === 2 ? 2 : 3);

      if (convertedUnit === 'feet') {
          val = decimalFeet; 
          unitLabel = `${dimPrefix}FEET`;
      } else if (convertedUnit === 'inch') {
          val = decimalFeet * Math.pow(12, convPower);
          unitLabel = `${dimPrefix}INCH`;
      } else if (convertedUnit === 'yard') {
          val = decimalFeet / Math.pow(3, convPower);
          unitLabel = `${dimPrefix}YARD`;
      }
      
      const formattedNum = parseFloat(val.toFixed(5)); 
      secondaryDisplay = `${formattedNum} ${unitLabel}`;
  }

  // Visibility Logic
  // Show Feet Label if:
  // 1. We have feet value
  // 2. OR preferred unit is feet and we have 0 yards (to show "0 FEET")
  // 3. OR we have no yards, no inches, no fraction (absolute 0)
  const showFeetLabel = finalFeet !== 0 || (preferredUnit === 'feet' && finalYards === 0) || (!showYardLabel && finalFeet === 0 && finalInches === 0 && numerator === 0 && preferredUnit === 'feet');

  // Show Inch Label if:
  // 1. We have inches
  // 2. OR we have a fraction (Must show "0 INCH 1/2" not just "1/2" in unit mode)
  // 3. OR preferred unit is inch (to show "0 INCH" if result is 0)
  const showInchLabel = finalInches !== 0 || numerator !== 0 || (preferredUnit === 'inch' && !showFeetLabel && !showYardLabel);

  const showDash = (showYardLabel && (showFeetLabel || showInchLabel || finalFeet > 0)) || (showFeetLabel && (showInchLabel || finalInches > 0));

  return {
    yard: finalYards,
    feet: finalFeet,
    inch: finalInches,
    numerator: numerator > 0 ? numerator : 0,
    denominator: denominator > 1 ? denominator : 0,
    isNegative,
    showFeetLabel,
    showInchLabel,
    showYardLabel,
    showDash,
    inputBuffer: '',
    secondaryDisplay,
    dimension: primaryDimension // Use the tracked dimension for the main display
  };
};

export const builderToDisplay = (builder: BuilderState, buffer: string): FormattedValue => {
  // Determine where the buffer is "previewing"
  let previewFeet = builder.feet || 0;
  let previewYard = builder.yard || 0;
  let previewInch = builder.inch || 0;
  let previewNum = builder.numerator || 0;
  let previewDenom = builder.denominator || 0;

  // Visual logic mapping buffer to the active slot
  if (buffer) {
      const val = parseInt(buffer);
      if (builder.yard === null && builder.feet === null && builder.inch === null && builder.numerator === null) {
          // No units or fraction set yet, ambiguous.
      }
      
      // Order of checks matches how we want the buffer to 'stick' to the last active element
      if (builder.yard !== null) {
         if (builder.feet === null) previewFeet = val;
      } 
      else if (builder.feet !== null) {
          if (builder.inch === null) {
              previewInch = val;
          } else if (builder.numerator === null) {
              previewNum = val;
          } else {
              previewDenom = val;
          }
      } 
      else if (builder.numerator !== null) {
          // Correctly map buffer to denominator if numerator is set but feet/yards are not
          previewDenom = val;
      }
      else if (builder.inch !== null) {
          // Case: Inches pressed first, now typing fraction
          if (builder.numerator === null) {
              previewNum = val;
          } else {
              previewDenom = val;
          }
      } 
      else {
         // Nothing set, typing first number (Integer part)
         previewFeet = val;
      }
  }

  return {
      yard: previewYard, 
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
    
    // Check if this is explicitly a Unitless operation (Pure Math)
    // It is unitless if no dimensions (feet, inch, yard) have been set.
    const isUnitlessInput = b.feet === null && b.inch === null && b.yard === null;

    // Power factor based on dimension
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
    
    // Fraction handling
    if (b.numerator !== null && b.denominator !== null && b.denominator !== 0) {
        const fractionVal = b.numerator / b.denominator;
        if (isUnitlessInput) {
            // Pure fraction (e.g. 1/16 = 0.0625)
            val += fractionVal;
        } else {
            // Dimensioned fraction (e.g. 1/16" = 1/16 inch to feet)
            val += fractionVal / Math.pow(12, power);
        }
    }
    
    // Buffer handling (Ambiguous trailing number)
    if (buffer) {
        const buffVal = parseFloat(buffer);
        
        // Priority 1: Denominator (If numerator exists and denom is null)
        if (b.denominator === null && b.numerator !== null) {
            const fractionVal = b.numerator / buffVal;
            if (isUnitlessInput) {
                val += fractionVal;
            } else {
                val += fractionVal / Math.pow(12, power);
            }
        }
        // Priority 2: Just a number (Integer Feet Base or Pure Number) - ONLY if nothing else is set
        else if (b.yard === null && b.feet === null && b.inch === null && b.numerator === null) {
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
    }
    return val;
};
