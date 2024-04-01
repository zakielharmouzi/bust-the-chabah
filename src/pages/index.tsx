import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const GRID_SIZE = 9 * 12;
const BUST_ATTEMPTS = 2;
const COLS = 12;
const ROWS = 9;

const colorProbabilities = {
  "0": { Red: 1, Orange: 0, Yellow: 0, Green: 0 },
  "1": { Red: 0, Orange: 1, Yellow: 0, Green: 0 },
  "2": { Red: 0, Orange: 0, Yellow: 1, Green: 0 },
  "3": { Red: 0, Orange: 0, Yellow: 0, Green: 1 },
  "4": { Red: 0, Orange: 0, Yellow: 0, Green: 1 },
};

export default function Home() {
  const [grid, setGrid] = useState(
    Array(GRID_SIZE).fill({ explored: false, color: "bg-white" })
  );
  const [probabilities, setProbabilities] = useState(
    Array(GRID_SIZE).fill(1 / GRID_SIZE)
  );
  const [totalProbability, setTotalProbability] = useState(1); // New state for tracking the total probability
  const [ghostIndex, setGhostIndex] = useState(null);
  const [peepToggle, setPeepToggle] = useState(false);
  const [bustAttempts, setBustAttempts] = useState(BUST_ATTEMPTS);
  const [score, setScore] = useState(100);
  const router = useRouter();

  useEffect(() => {
    const placeGhost = () => {
      const index = Math.floor(Math.random() * GRID_SIZE);
      setGhostIndex(index);
    };

    placeGhost();
  }, []);

  const calculateDistance = (index1, index2) => {
    const x1 = index1 % COLS;
    const y1 = Math.floor(index1 / COLS);
    const x2 = index2 % COLS;
    const y2 = Math.floor(index2 / COLS);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  };

  const getDistanceType = (distance) => {
    if (distance === 0) return "0";
    if (distance <= 2) return "1";
    if (distance <= 4) return "2";
    if (distance <= 6) return "3";
    return "4";
  };

  const handleCellClick = (index) => {
    if (grid[index].explored) return;

    const distance = calculateDistance(index, ghostIndex);
    console.log("Distance:", distance);
    const distanceType = getDistanceType(distance);
    console.log("Distance Type:", distanceType);
    const sensedColor = sampleColorBasedOnProbability(
      colorProbabilities[distanceType]
    );
    sensedColor.charAt(0).toUpperCase() + sensedColor.slice(1);
    console.log("Sensed Color (Lowercase):", sensedColor);

    setGrid((prevGrid) =>
      prevGrid.map((cell, i) =>
        i === index
          ? {
              ...cell,
              explored: true,
              color: `bg-${sensedColor.toLowerCase()}-500`,
            }
          : cell
      )
    );
    setScore((prevScore) => prevScore - 1);

    const newProbabilities = probabilities.slice();
    for (let i = 0; i < GRID_SIZE; i++) {
      const dist = calculateDistance(i, index);
      const distType = getDistanceType(dist);
      newProbabilities[i] *= colorProbabilities[distType][sensedColor];
    }

    const totalProb = newProbabilities.reduce((a, b) => a + b, 0);
    setProbabilities(newProbabilities.map((prob) => prob / totalProb));
    setTotalProbability(totalProb); // Update the total probability
  };

  function sampleColorBasedOnProbability(distribution) {
    let sum = 0;
    const r = Math.random();
    for (const color in distribution) {
      sum += distribution[color];
      if (r <= sum) return color;
    }
    return "Red"; // Default to red as a fallback
  }

  function handleBustButtonClick() {
    if (bustAttempts <= 0) return;

    setBustAttempts((prev) => prev - 1);

    if (grid[ghostIndex].explored) {
      alert("Congratulations, you busted the ghost!");
      router.reload();
    } else {
      if (bustAttempts - 1 === 0) {
        alert("You've run out of bust attempts. Game over!");
        router.reload();
      }
    }
  }

  function handlePeepToggle() {
    setPeepToggle((prev) => !prev);
  }

  return (
    <div className="flex p-4">
      <div className="flex flex-col gap-4 mr-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleBustButtonClick}
        >
          Bust the ghost
        </button>
        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={handlePeepToggle}
        >
          Peep
        </button>
        <span className="text-lg font-semibold">
          Remaining bust attempts: {bustAttempts}
        </span>
        <span className="text-lg font-semibold">Score: {score}</span>
        {/* Display the total probability */}
        <span className="text-lg font-semibold">
          Total Probability: {totalProbability.toFixed(2)}
        </span>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-12 w-3/5 pl-8">
          {grid.map((cell, index) => (
            <div
              key={index}
              className={`w-12 h-12 border border-gray-300 ${cell.color} flex items-center justify-center cursor-pointer`}
              onClick={() => handleCellClick(index)}
            >
              {peepToggle ? (
                <span className="text-xs opacity-75">
                  {probabilities[index].toFixed(2)}
                </span>
              ) : (
                ""
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
