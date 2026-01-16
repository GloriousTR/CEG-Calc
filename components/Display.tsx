
import React from 'react';
import { FormattedValue } from '../types';

interface DisplayProps {
    value: FormattedValue;
    onBackspace: () => void; // Add backspace handler prop
}

const Display: React.FC<DisplayProps> = ({ value, onBackspace }) => {
    const { yard, feet, inch, numerator, denominator, isNegative, showFeetLabel, showInchLabel, showYardLabel, showDash, inputBuffer, secondaryDisplay, dimension } = value;

    // We only render parts that have value or are active
    const hasFeet = feet !== 0 || showFeetLabel;
    // If numerator exists or label is forced, we ensure the inch section renders.
    const hasInch = inch !== 0 || showInchLabel;
    // Yard is usually exclusive or primary, but we'll render it if active
    const hasYard = showYardLabel; // Always show if explicitly set

    // Special case: if input buffer is active for first number and we aren't showing labels yet
    const isSimpleNumber = !showFeetLabel && !showInchLabel && !showYardLabel && !showDash && numerator === 0;

    const dimPrefix = dimension === 2 ? 'SQ ' : (dimension === 3 ? 'CB ' : '');

    return (
        <div
            onClick={onBackspace}
            className="w-full flex-1 bg-gray-100 dark:bg-[#111315] rounded-xl py-4 px-5 flex flex-col justify-between shadow-inner border border-gray-200 dark:border-gray-800 relative overflow-hidden transition-colors duration-300 cursor-pointer active:bg-gray-200 dark:active:bg-[#0d0e10] group min-h-[160px] md:min-h-[240px]"
        >

            {/* Top Status Bar */}
            <div className="flex justify-between items-start w-full h-6 opacity-40 text-[10px] font-mono tracking-widest uppercase">
                <span>{inputBuffer ? 'ENTRY' : 'RESULT'}</span>
                {/* Visual hint for backspace */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">⌫ TAP TO DELETE</span>
            </div>

            <div className="flex flex-col h-full justify-end">
                {/* Main Numbers (Top Row) */}
                <div className="flex items-end justify-end w-full select-none pb-1">

                    {isSimpleNumber ? (
                        <span className="text-6xl sm:text-[5rem] lg:text-[6rem] font-mono text-gray-800 dark:text-gray-100 break-all text-right leading-tight">
                            {/* If typing a decimal, inputBuffer might be "5.", show that directly if active */}
                            {inputBuffer ? inputBuffer : feet}
                        </span>
                    ) : (
                        <div className="flex items-baseline justify-end space-x-2 sm:space-x-3">

                            {isNegative && (
                                <span className="text-4xl font-mono text-gray-400 mr-2">-</span>
                            )}

                            {/* Yard */}
                            {hasYard && (
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl sm:text-[4rem] lg:text-[5rem] font-mono text-gray-800 dark:text-gray-100 leading-none">
                                        {yard}
                                    </span>
                                    <span className={`text-[10px] font-bold text-gray-400 mt-1 tracking-widest ${showYardLabel ? 'opacity-100' : 'opacity-0'}`}>
                                        {dimPrefix}YARD
                                    </span>
                                </div>
                            )}

                            {/* Dash Separator (Only if mixing Yards and Feet, or Feet and Inches) */}
                            {showDash && hasYard && (showFeetLabel || hasFeet) && (
                                <div className="flex flex-col justify-start h-[3.5rem] sm:h-[4rem] lg:h-[5rem]">
                                    <span className="text-2xl sm:text-3xl font-mono text-gray-300 dark:text-gray-600 self-center">-</span>
                                </div>
                            )}


                            {/* Feet */}
                            {((hasFeet || showFeetLabel) && !showYardLabel) && (
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl sm:text-[4rem] lg:text-[5rem] font-mono text-gray-800 dark:text-gray-100 leading-none">
                                        {feet}
                                    </span>
                                    <span className={`text-[10px] font-bold text-gray-400 mt-1 tracking-widest ${showFeetLabel ? 'opacity-100' : 'opacity-0'}`}>
                                        {dimPrefix}FEET
                                    </span>
                                </div>
                            )}

                            {/* Dash Separator */}
                            {showDash && !hasYard && (
                                <div className="flex flex-col justify-start h-[3.5rem] sm:h-[4rem] lg:h-[5rem]">
                                    <span className="text-2xl sm:text-3xl font-mono text-gray-300 dark:text-gray-600 self-center">-</span>
                                </div>
                            )}

                            {/* Inches */}
                            {(hasInch || showInchLabel) && (
                                <div className="flex flex-col items-center">
                                    <span className="text-5xl sm:text-[4rem] lg:text-[5rem] font-mono text-gray-800 dark:text-gray-100 leading-none">
                                        {inch}
                                    </span>
                                    <span className={`text-[10px] font-bold text-gray-400 mt-1 tracking-widest ${showInchLabel ? 'opacity-100' : 'opacity-0'}`}>
                                        {dimPrefix}INCH
                                    </span>
                                </div>
                            )}

                            {/* Fraction */}
                            {numerator > 0 && (
                                <div className="flex flex-col items-start justify-end h-[4rem] sm:h-[4.5rem] lg:h-[5.5rem] ml-1">
                                    <div className="flex flex-col items-center leading-none text-gray-800 dark:text-gray-100 font-mono">
                                        <span className="text-xl sm:text-2xl lg:text-3xl border-b border-gray-400 dark:border-gray-600 px-1 mb-0.5">
                                            {numerator}
                                        </span>
                                        <span className="text-xl sm:text-2xl lg:text-3xl px-1">
                                            {denominator === 0 ? '' : denominator}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Secondary Display (Bottom Row) - Converted Value */}
                <div className="h-10 w-full flex items-end justify-end border-t border-gray-200 dark:border-gray-800 mt-2 pt-1">
                    <span className="font-mono text-2xl lg:text-3xl text-gray-400 dark:text-gray-500 tracking-wider">
                        {secondaryDisplay}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Display);
