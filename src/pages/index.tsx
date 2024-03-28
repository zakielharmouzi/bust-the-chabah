import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const GRID_SIZE = 9 * 12;
const BUST_ATTEMPTS = 2;

export default function Home() {
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null));
  const [peepToggle, setPeepToggle] = useState(false);
  const [bustAttempts, setBustAttempts] = useState(BUST_ATTEMPTS);
  const [score, setScore] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const router = useRouter();
  let placed = false;

  const handleCellClick = (index: number) => {
    setClickCount((prevCount) => prevCount + 1);
    setScore((prevScore) => prevScore - 1);
    if (grid[index] === "Ghost") {
      setBustAttempts((prevAttempts) => prevAttempts - 1);
    }

    console.log(`Cell ${index} clicked`);

    if (clickCount >= 19) {
      // Stop the game after 20 clicks
      alert("Game over!");
      router.reload();
      // You can add additional logic here to handle game over state
    }
  };

  const placeGhost = () => {
    if (placed) {
      return;
    }
    console.log("Placing ghost...");
    const xg = Math.floor(Math.random() * 12);
    const yg = Math.floor(Math.random() * 9);
    console.log("Ghost placed at", xg, yg);
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      const ghostIndex = yg * 12 + xg;
      newGrid[ghostIndex] = "Ghost";
      return newGrid;
    });
    console.log("Ghost placed at", xg, yg);
    placed = true;
    return { xg, yg };
  };

  const handleBustButtonClick = () => {
    // Implement bust logic here
  };

  const handlePeepToggle = () => {
    setPeepToggle((prevToggle) => !prevToggle);
  };

  useEffect(() => {
    placeGhost();
  }, []); // Empty dependency array ensures this runs only on initial load

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
              className={`w-12 h-12 border border-gray-300 ${
                peepToggle && cell === "Ghost" ? "bg-red-500" : "bg-white"
              } flex items-center justify-center cursor-pointer`}
              onClick={() => handleCellClick(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
