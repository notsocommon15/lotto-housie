import React from 'react';

const HousieTicket = ({
    ticketNumbers,
    calledNumbers = [],
    className = '',
    showWinIndicators = false,
    winStatus = []
}) => {
    const isNumberCalled = (number) => {
        return number !== 0 && calledNumbers.includes(number);
    };

    const getRowWinStatus = (rowIndex) => {
        const rowNames = ['Top Line', 'Middle Line', 'Bottom Line'];
        return winStatus.includes(rowNames[rowIndex]);
    };

    const isFullHouse = winStatus.includes('Full House');

    return (
        <div className={`bg-white border-2 border-gray-300 rounded-lg p-4 ${className}`}>
            {showWinIndicators && winStatus.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                    {winStatus.map((win, index) => (
                        <span
                            key={index}
                            className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded"
                        >
                            {win}
                        </span>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-9 gap-1">
                {ticketNumbers.map((row, rowIndex) => (
                    row.map((number, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                aspect-square flex items-center justify-center text-sm font-semibold border rounded
                ${number === 0
                                    ? 'bg-gray-100 border-gray-200'
                                    : isNumberCalled(number)
                                        ? 'bg-green-500 text-white border-green-600'
                                        : 'bg-white border-gray-400 text-gray-900'
                                }
                ${showWinIndicators && getRowWinStatus(rowIndex) && number !== 0
                                    ? 'ring-2 ring-blue-400'
                                    : ''
                                }
                ${showWinIndicators && isFullHouse && number !== 0
                                    ? 'ring-2 ring-yellow-400'
                                    : ''
                                }
              `}
                        >
                            {number !== 0 ? number : ''}
                        </div>
                    ))
                ))}
            </div>

            <div className="mt-3 text-xs text-gray-600 flex justify-between">
                <span>Total Numbers: {ticketNumbers.flat().filter(n => n !== 0).length}</span>
                <span>Matched: {ticketNumbers.flat().filter(n => isNumberCalled(n)).length}</span>
            </div>
        </div>
    );
};

export default HousieTicket;