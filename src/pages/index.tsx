import React from "react";
import { useDisclosure } from "@nextui-org/react";
import { useRouter } from "next/router";

export type CellColor = "red" | "orange" | "yellow" | "green";
export type Direction = "N" | "E" | "S" | "W" | "";
export interface GridCell {
  id: number;
  color?: CellColor;
  probability: number;
  direction: Direction;
}

export const gridSize = { rows: 9, cols: 12 };

export const initialGridState = (): GridCell[][] => {
  let cellId = 0;
  const totalCells = gridSize.rows * gridSize.cols;
  const initialProbability = 1 / totalCells;

  return Array.from({ length: gridSize.rows }, () =>
    Array.from({ length: gridSize.cols }, () => ({
      id: cellId++,
      probability: initialProbability,
      direction: "",
    }))
  );
};

export const placeGhost = () => {
  const xg = Math.floor(Math.random() * gridSize.cols);
  const yg = Math.floor(Math.random() * gridSize.rows);
  console.log("Ghost placed at", xg, yg);
  return [xg, yg];
};

export const manhattanDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => Math.abs(x1 - x2) + Math.abs(y1 - y2);

export const distanceToColor = (distance: number): CellColor => {
  if (distance === 0) return "red";
  if (distance <= 2) return "orange";
  if (distance <= 4) return "yellow";
  return "green";
};

interface ColorProbability {
  [distance: string]: { [color in CellColor]: number };
}

const conditionalColorProbabilities: ColorProbability = {
  "0": { red: 0.8, orange: 0.1, yellow: 0.05, green: 0.05 },
  "1": { red: 0.05, orange: 0.75, yellow: 0.15, green: 0.05 },
  "2": { red: 0.1, orange: 0.7, yellow: 0.15, green: 0.05 },
  "3": { red: 0.05, orange: 0.15, yellow: 0.65, green: 0.15 },
  "4": { red: 0.05, orange: 0.05, yellow: 0.7, green: 0.2 },
  ">5": { red: 0.02, orange: 0.08, yellow: 0.2, green: 0.7 },
};

export const DistanceSense = (
  grid: GridCell[][],
  ghostX: number,
  ghostY: number,
  clickX: number,
  clickY: number
): GridCell[][] => {
  const gridDistance = manhattanDistance(clickX, clickY, ghostX, ghostY);
  const cellColor = sampleColorFromDistance(gridDistance);

  return grid.map((row, rowIndex) =>
    row.map((cell, columnIndex) =>
      columnIndex === clickX && rowIndex === clickY
        ? { ...cell, color: cellColor }
        : cell
    )
  );
};
function sampleColorFromDistance(distance: number): CellColor {
  const distanceKey =
    distance === 0
      ? "0"
      : distance === 1
      ? "1"
      : distance === 2
      ? "2"
      : distance === 3
      ? "3"
      : distance === 4
      ? "4"
      : ">5";

  const probabilities = conditionalColorProbabilities[distanceKey];

  let cumulativeProbability = 0;
  const randomThreshold = Math.random();

  for (const color in probabilities) {
    cumulativeProbability += probabilities[color as CellColor];
    if (randomThreshold < cumulativeProbability) {
      return color as CellColor;
    }
  }

  return "green";
}

export const UpdatePosteriorGhostLocationProbabilities = (
  grid: GridCell[][],
  clickX: number,
  clickY: number,
  observedColor: CellColor
): GridCell[][] => {
  let totalProb = 0;
  let gridUpdated = grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      const cellDistance = manhattanDistance(
        colIndex,
        rowIndex,
        clickX,
        clickY
      );
      const cellLikelihood = jointTableProbability(observedColor, cellDistance);
      const updatedProb = cell.probability * cellLikelihood;
      totalProb += updatedProb;
      return { ...cell, probability: updatedProb };
    })
  );

  const normalizationFactor =
    totalProb === 0 ? gridSize.rows * gridSize.cols : totalProb;

  return gridUpdated.map((row) =>
    row.map((cell) => ({
      ...cell,
      probability: cell.probability / normalizationFactor,
    }))
  );
};

const jointTableProbability = (
  color: CellColor,
  distanceFromGhost: number
): number => {
  if (color === "red" && distanceFromGhost === 0) return 0.8;
  if (color === "orange" && distanceFromGhost === 0) return 0.1;
  if (color === "yellow" && distanceFromGhost === 0) return 0.05;
  if (color === "green" && distanceFromGhost === 0) return 0.05;

  if (color === "red" && distanceFromGhost === 1) return 0.15;
  if (color === "orange" && distanceFromGhost === 1) return 0.65;
  if (color === "yellow" && distanceFromGhost === 1) return 0.15;
  if (color === "green" && distanceFromGhost === 1) return 0.05;

  if (color === "red" && distanceFromGhost === 2) return 0.1;
  if (color === "orange" && distanceFromGhost === 2) return 0.7;
  if (color === "yellow" && distanceFromGhost === 2) return 0.15;
  if (color === "green" && distanceFromGhost === 2) return 0.05;

  if (color === "red" && distanceFromGhost === 3) return 0.05;
  if (color === "orange" && distanceFromGhost === 3) return 0.15;
  if (color === "yellow" && distanceFromGhost === 3) return 0.65;
  if (color === "green" && distanceFromGhost === 3) return 0.15;

  if (color === "red" && distanceFromGhost === 4) return 0.05;
  if (color === "orange" && distanceFromGhost === 4) return 0.05;
  if (color === "yellow" && distanceFromGhost === 4) return 0.7;
  if (color === "green" && distanceFromGhost === 4) return 0.2;

  if (color === "red" && distanceFromGhost >= 5) return 0.02;
  if (color === "orange" && distanceFromGhost >= 5) return 0.08;
  if (color === "yellow" && distanceFromGhost >= 5) return 0.2;
  if (color === "green" && distanceFromGhost >= 5) return 0.7;

  return 0;
};

interface GridProps {
  grid: GridCell[][];
  onCellClick: (x: number, y: number) => void;
  peep: boolean;
}

const Grid: React.FC<GridProps> = ({ grid, onCellClick, peep }) => {
  return (
    <div
      className="max-w-6xl grid grid-cols-12 gap-2 bg-gray-900 p-2 rounded-lg pb-3"
      style={{ boxShadow: "0 0 20px 0 rgba(255,255,255,0.1)" }}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, columnIndex) => (
          <button
            key={`${columnIndex}-${rowIndex}`}
            className={`w-16 h-12 flex items-center justify-center rounded transition-all duration-150 ${
              cell.color ? `bg-${cell.color}-500` : "bg-gray-300"
            }`}
            style={{
              backgroundColor:
                cell.color && cell.color.length > 0 ? cell.color : "",
            }}
            onClick={() => onCellClick(columnIndex, rowIndex)}
          >
            {peep && (
              <span className="text-sm font-bold text-gray-900">
                {cell.probability.toFixed(2)}
              </span>
            )}
          </button>
        ))
      )}
    </div>
  );
};

const BUSTS = 2;
const CREDITS = 40;
const Direc = "SE";

export default function Home() {
  const router = useRouter();
  const [grid, setGrid] = React.useState<GridCell[][]>(initialGridState());
  const [ghost, setGhost] = React.useState<[number, number]>(placeGhost());
  const [lastClicked, setLastClicked] = React.useState<[number, number]>([
    0, 0,
  ]);
  const [peep, setPeep] = React.useState<boolean>(true);
  const [remainingBusts, setRemainingBusts] = React.useState<number>(BUSTS);
  const [credits, setCredits] = React.useState<number>(CREDITS);

  const handleCellClick = (x: number, y: number) => {
    setLastClicked([x, y]);
    if (grid[y][x].color) return;
    setCredits(credits - 1);
    let updatedGrid = DistanceSense(grid, ghost[0], ghost[1], x, y);
    updatedGrid = UpdatePosteriorGhostLocationProbabilities(
      updatedGrid,
      x,
      y,
      updatedGrid[y][x].color
    );
    setGrid(updatedGrid);
  };

  React.useEffect(() => {
    if (credits === 0) {
      alert("You have ran out of credits you lost the game");
      router.reload();
    } else if (remainingBusts === 0) {
      alert("You have ran out of busts you lost the game");
      router.reload();
    }
  }, [credits, remainingBusts]);

  return (
    <div className="h-screen w-screen bg-gray-700 text-white">
      <div className="pt-10 flex flex-col items-center justify-center">
        <div className="flex flex-wrap justify-center gap-10">
          {/* Grid on the left */}
          <div className="flex flex-col gap-4">
            <Grid grid={grid} onCellClick={handleCellClick} peep={peep} />
          </div>
          {/* Buttons on the right */}
          <div className="flex flex-col gap-6">
            <p>
              Remaining Busts:{" "}
              <span className="font-semibold">{remainingBusts}</span>
            </p>
            <p>
              Credits: <span className="font-semibold">{credits}</span>
            </p>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out"
              onClick={() => {
                if (remainingBusts === 0) return;
                if (
                  lastClicked[0] === ghost[0] &&
                  lastClicked[1] === ghost[1]
                ) {
                  alert("Congratulations, you have won!");
                  router.reload();
                  return;
                }
                setRemainingBusts(remainingBusts - 1);
              }}
            >
              Bust Ghost
            </button>
            <h4 className="text-center">
              Selected cell: row: {lastClicked[0] + 1}, column:{" "}
              {lastClicked[1] + 1}
            </h4>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 ease-in-out"
              onClick={() => setPeep(!peep)}
            >
              Peep
            </button>
            <div>
              <p>direction = {Direc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
