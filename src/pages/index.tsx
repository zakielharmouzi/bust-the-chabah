import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const GRID_SIZE = 9 * 12;
const BUST_ATTEMPTS = 2;
const COLS = 12;
const ROWS = 9;

export default function Home() {
  // Initialize the grid with additional properties
  const [grid, setGrid] = useState(
    Array(GRID_SIZE).fill({ status: null, explored: false, color: "bg-white" })
  );
  const [ghostIndex, setGhostIndex] = useState(null);
  const [peepToggle, setPeepToggle] = useState(false);
  const [bustAttempts, setBustAttempts] = useState(BUST_ATTEMPTS);
  const [score, setScore] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const router = useRouter();
  let placed = false;

  // Helper function to calculate distance
  const calculateDistance = (index1, index2) => {
    const x1 = index1 % COLS;
    const y1 = Math.floor(index1 / COLS);
    const x2 = index2 % COLS;
    const y2 = Math.floor(index2 / COLS);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  };

  // Helper function to determine the color based on distance
  const determineColor = (distance) => {
    if (distance === 0) return "bg-red-500";
    if (distance <= 2) return "bg-orange-500";
    if (distance <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleCellClick = (index: number) => {
    // Check if the cell has already been explored
    if (grid[index].explored) return;

    // Calculate the distance from the clicked cell to the ghost
    const distance =
      ghostIndex !== null ? calculateDistance(index, ghostIndex) : null;
    const color = determineColor(distance);

    // Update the grid with the new status
    setGrid((prevGrid) =>
      prevGrid.map((cell, i) =>
        i === index ? { ...cell, explored: true, color: color } : cell
      )
    );

    // Update game state
    setClickCount((prevCount) => prevCount + 1);
    setScore((prevScore) => prevScore - 1);

    if (grid[index].status === "Ghost") {
      setBustAttempts((prevAttempts) => prevAttempts - 1);
    }

    console.log(`Cell ${index} clicked with color ${color}`);

    if (clickCount >= 19) {
      alert("Game over!");
      router.reload();
    }
  };

  const placeGhost = () => {
    if (placed) return;

    console.log("Placing ghost...");
    const xg = Math.floor(Math.random() * COLS);
    const yg = Math.floor(Math.random() * ROWS);
    const ghostIndex = yg * COLS + xg;
    setGhostIndex(ghostIndex);
    setGrid((prevGrid) =>
      prevGrid.map((cell, index) =>
        index === ghostIndex ? { ...cell, status: "Ghost" } : cell
      )
    );
    placed = true;
  };

  const handleBustButtonClick = () => {
    // Implement bust logic here
  };

  const handlePeepToggle = () => {
    setPeepToggle((prevToggle) => !prevToggle);

    // Show the position of the ghost when the "Peep" button is clicked
    if (!peepToggle && ghostIndex !== null) {
      const ghostCell = grid[ghostIndex];
      const ghostColor = determineColor(0); // Distance is 0 for the ghost cell
      setGrid((prevGrid) =>
        prevGrid.map((cell, index) =>
          index === ghostIndex ? { ...cell, color: ghostColor } : cell
        )
      );
    }
  };

  useEffect(() => {
    placeGhost();
  }, []);

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
      </div>
      <div className="flex-1">
        <div
          className="grid grid-cols-12 gap-0 pl-8"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(12, 1fr);width: 0px`,
          }}
        >
          {grid.map((cell, index) => (
            <div
              key={index}
              className={`w-12 h-12 border border-gray-300 ${cell.color} ${
                peepToggle && cell.status === "Ghost" ? "bg-red-500" : ""
              } flex items-center justify-center cursor-pointer`}
              onClick={() => handleCellClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
