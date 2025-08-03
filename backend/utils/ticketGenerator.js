// Lotto Housie Ticket Generator
// Rules: 3 rows x 9 columns, each row has exactly 5 numbers and 4 blanks
// Column ranges: 1-9, 10-19, 20-29, ..., 80-89, 90-99

function generateHousieTicket() {
    // Initialize 3x9 grid with zeros (0 represents blank)
    const ticket = Array(3).fill().map(() => Array(9).fill(0));

    // Define number ranges for each column
    const columnRanges = [
        [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
        [50, 59], [60, 69], [70, 79], [80, 89]
    ];

    // For each column, decide how many numbers to place (1-3 per column)
    const numbersPerColumn = Array(9).fill(0);
    let totalNumbers = 0;

    // We need exactly 15 numbers total (5 per row)
    while (totalNumbers < 15) {
        for (let col = 0; col < 9; col++) {
            if (totalNumbers >= 15) break;
            if (numbersPerColumn[col] < 3 && Math.random() > 0.3) {
                numbersPerColumn[col]++;
                totalNumbers++;
            }
        }
    }

    // Ensure we have exactly 15 numbers
    while (totalNumbers > 15) {
        const col = Math.floor(Math.random() * 9);
        if (numbersPerColumn[col] > 0) {
            numbersPerColumn[col]--;
            totalNumbers--;
        }
    }

    // Fill each column with random numbers from its range
    for (let col = 0; col < 9; col++) {
        if (numbersPerColumn[col] === 0) continue;

        const [min, max] = columnRanges[col];
        const availableNumbers = [];

        // Handle column 9 (90-99) - only has 10 numbers
        if (col === 8) {
            for (let i = 90; i <= 99; i++) {
                availableNumbers.push(i);
            }
        } else {
            for (let i = min; i <= max; i++) {
                availableNumbers.push(i);
            }
        }

        // Shuffle and pick required numbers
        const shuffled = availableNumbers.sort(() => Math.random() - 0.5);
        const selectedNumbers = shuffled.slice(0, numbersPerColumn[col]);

        // Place numbers in random rows of this column
        const availableRows = [0, 1, 2];
        for (const number of selectedNumbers) {
            const randomRowIndex = Math.floor(Math.random() * availableRows.length);
            const row = availableRows[randomRowIndex];
            ticket[row][col] = number;
            availableRows.splice(randomRowIndex, 1);
        }
    }

    // Ensure each row has exactly 5 numbers
    for (let row = 0; row < 3; row++) {
        const rowNumbers = ticket[row].filter(num => num !== 0);

        // If row has more than 5 numbers, remove excess
        while (rowNumbers.length > 5) {
            const nonZeroIndices = [];
            for (let col = 0; col < 9; col++) {
                if (ticket[row][col] !== 0) {
                    nonZeroIndices.push(col);
                }
            }
            const randomIndex = Math.floor(Math.random() * nonZeroIndices.length);
            const colToRemove = nonZeroIndices[randomIndex];
            ticket[row][colToRemove] = 0;
            rowNumbers.pop();
        }

        // If row has less than 5 numbers, add more
        while (rowNumbers.length < 5) {
            // Find columns with available numbers that aren't used in this row
            const availableCols = [];
            for (let col = 0; col < 9; col++) {
                if (ticket[row][col] === 0) {
                    // Check if this column range has unused numbers
                    const [min, max] = columnRanges[col];
                    const usedInColumn = [];
                    for (let r = 0; r < 3; r++) {
                        if (ticket[r][col] !== 0) {
                            usedInColumn.push(ticket[r][col]);
                        }
                    }

                    const rangeNumbers = [];
                    if (col === 8) {
                        for (let i = 90; i <= 99; i++) {
                            if (!usedInColumn.includes(i)) rangeNumbers.push(i);
                        }
                    } else {
                        for (let i = min; i <= max; i++) {
                            if (!usedInColumn.includes(i)) rangeNumbers.push(i);
                        }
                    }

                    if (rangeNumbers.length > 0) {
                        availableCols.push({ col, numbers: rangeNumbers });
                    }
                }
            }

            if (availableCols.length > 0) {
                const randomCol = availableCols[Math.floor(Math.random() * availableCols.length)];
                const randomNumber = randomCol.numbers[Math.floor(Math.random() * randomCol.numbers.length)];
                ticket[row][randomCol.col] = randomNumber;
                rowNumbers.push(randomNumber);
            } else {
                break; // Can't add more numbers
            }
        }
    }

    // Sort numbers in each row in ascending order
    for (let row = 0; row < 3; row++) {
        const rowData = [];
        for (let col = 0; col < 9; col++) {
            rowData.push({ value: ticket[row][col], col });
        }

        // Sort non-zero values
        const nonZeroValues = rowData.filter(item => item.value !== 0).sort((a, b) => a.value - b.value);
        const zeroPositions = rowData.filter(item => item.value === 0).map(item => item.col);

        // Reset row
        ticket[row].fill(0);

        // Place sorted non-zero values back in their original columns
        for (const item of nonZeroValues) {
            ticket[row][item.col] = item.value;
        }
    }

    return ticket;
}

function validateTicket(ticket) {
    // Check ticket structure
    if (!Array.isArray(ticket) || ticket.length !== 3) return false;

    for (let row = 0; row < 3; row++) {
        if (!Array.isArray(ticket[row]) || ticket[row].length !== 9) return false;

        // Check each row has exactly 5 numbers
        const numbersInRow = ticket[row].filter(num => num !== 0).length;
        if (numbersInRow !== 5) return false;
    }

    // Check column ranges
    for (let col = 0; col < 9; col++) {
        const [min, max] = col === 8 ? [90, 99] : [(col * 10) + 1, (col + 1) * 10 - 1];

        for (let row = 0; row < 3; row++) {
            const value = ticket[row][col];
            if (value !== 0 && (value < min || value > max)) {
                return false;
            }
        }
    }

    // Check for duplicate numbers
    const allNumbers = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
            if (ticket[row][col] !== 0) {
                if (allNumbers.includes(ticket[row][col])) return false;
                allNumbers.push(ticket[row][col]);
            }
        }
    }

    return true;
}

module.exports = {
    generateHousieTicket,
    validateTicket
};