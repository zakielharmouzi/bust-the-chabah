import React from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
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
  let id = 0;
  return Array.from({ length: gridSize.rows }, () =>
    Array.from({ length: gridSize.cols }, () => ({
      id: id++,
      probability: 1 / (gridSize.rows * gridSize.cols),
      direction: "",
    }))
  );
};

export const placeGhost = (): [number, number] => {
  const x = Math.floor(Math.random() * gridSize.cols);
  const y = Math.floor(Math.random() * gridSize.rows);
  console.log("Ghost placed at", x, y);
  return [x, y];
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
  "1": { red: 0.15, orange: 0.65, yellow: 0.15, green: 0.05 },
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
  const distance = manhattanDistance(clickX, clickY, ghostX, ghostY);
  const color = sampleColorFromDistance(distance);
  return grid.map((row, y) =>
    row.map((cell, x) =>
      x === clickX && y === clickY ? { ...cell, color } : cell
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
  return "green"; // Default fallback
}

export const UpdatePosteriorGhostLocationProbabilities = (
  grid: GridCell[][],
  clickX: number,
  clickY: number,
  observedColor: CellColor
): GridCell[][] => {
  let totalProbability = 0;
  let updatedGrid = grid.map((row, y) =>
    row.map((cell, x) => {
      const distance = manhattanDistance(x, y, clickX, clickY);
      const likelihood = jointTableProbability(observedColor, distance);
      const newProbability = cell.probability * likelihood;
      totalProbability += newProbability;
      return { ...cell, probability: newProbability };
    })
  );

  if (totalProbability === 0)
    return updatedGrid.map((row) =>
      row.map((cell) => ({
        ...cell,
        probability: 1 / (gridSize.rows * gridSize.cols),
      }))
    );

  return updatedGrid.map((row) =>
    row.map((cell) => ({
      ...cell,
      probability: cell.probability / totalProbability,
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

// Grid component
interface GridProps {
  grid: GridCell[][];
  onCellClick: (x: number, y: number) => void;
  peep: boolean;
  focusedMode: boolean;
}

const Grid: React.FC<GridProps> = ({
  grid,
  onCellClick,
  peep,
  focusedMode,
}) => {
  const findBiggestNumber = (arr: GridCell[][]) => {
    let biggest = 0;
    arr.forEach((row) =>
      row.forEach((cell) => {
        if (cell.probability > biggest) biggest = cell.probability;
      })
    );
    return biggest;
  };

  return (
    <div
      className="ma-w-5xl grid grid-cols-12 gap-1 bg-black p-1 rounded-md"
      style={{ boxShadow: "0 0 50px 0 rgba(0,0,0,0.2)" }}
    >
      {grid.map((row, y) =>
        row.map((cell, x) => (
          <button
            key={`${x}-${y}`}
            className={`w-16 h-10 flex items-center justify-center ${
              cell.color ? `bg-${cell.color}-400` : "bg-white"
            } ${
              focusedMode && cell.probability === findBiggestNumber(grid)
                ? "border-2 border-red-500"
                : ""
            } transition-all duration-150`}
            style={{
              backgroundColor:
                cell.color && cell.color.length > 0 ? cell.color : "",
            }}
            onClick={() => onCellClick(x, y)}
          >
            {peep && `${(cell.probability * 100).toFixed(2)}%`}
          </button>
        ))
      )}
    </div>
  );
};

// Main game component (merged content)
const NUMBER_OF_BUSTS = 2;
const NUMBER_OF_CREDITS = 50;

export default function Home() {
  const router = useRouter();
  const [grid, setGrid] = React.useState<GridCell[][]>(initialGridState());
  const [ghost, setGhost] = React.useState<[number, number]>(placeGhost());
  const [focusedMode, setFocusedMode] = React.useState<boolean>(false);
  // const [lastClicked, setLastClicked] = React.useState<[number, number]>();
  const [lastClicked, setLastClicked] = React.useState<[number, number]>([
    0, 0,
  ]);
  const [peep, setPeep] = React.useState<boolean>(true);
  const [remainingBusts, setRemainingBusts] =
    React.useState<number>(NUMBER_OF_BUSTS);
  const [credits, setCredits] = React.useState<number>(NUMBER_OF_CREDITS);
  const {
    isOpen: GameOverIsOpen,
    onOpen: OnOpenGameOver,
    onOpenChange: OnOpenGameOverChange,
  } = useDisclosure();
  const {
    isOpen: WinIsOpen,
    onOpen: OnOpenWin,
    onOpenChange: OnOpenWinChange,
  } = useDisclosure();

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

  // React.useEffect(() => {
  //   console.log("Grid", grid);
  // }, [grid]);

  React.useEffect(() => {
    if (credits === 0 || remainingBusts === 0) {
      OnOpenGameOver();
    }
  }, [credits, remainingBusts]);

  return (
    <div className="h-screen w-screen">
      <div className="p-4 flex flex-col py-14 items-center justify-center">
        <h1 className="text-center text-3xl font-bold mb-20">
          Bust the Ghost Game
        </h1>
        <div className="flex flex-row gap-20">
          <div className="flex flex-col gap-4">
            <button
              style={{ boxShadow: "0 0 50px 0 rgba(37,99,235,0.2)" }}
              className="z-40 bg-gradient-to-br from-[#06b7f9] to-[#194aec] text-center text-white px-4 py-2 rounded-lg min-w-fit hover:brightness-95 transition-all duration-150"
              onClick={() => {
                setPeep(!peep);
              }}
            >
              Peep
            </button>
            <button
              className="z-40 bg-gradient-to-br from-red-500 to-red-800 text-center text-white px-8 py-2 rounded-lg min-w-fit hover:brightness-95 transition-all duration-150"
              style={{ boxShadow: "0 0 50px 0 rgba(255, 0, 0, 0.2)" }}
              onClick={() => {
                if (remainingBusts === 0) return;
                if (
                  lastClicked[0] === ghost[0] &&
                  lastClicked[1] === ghost[1]
                ) {
                  alert("congratulation you have won!");
                  router.reload();
                  return;
                }
                setRemainingBusts(remainingBusts - 1);
              }}
            >
              Bust Ghost ({lastClicked[0]}, {lastClicked[1]})
            </button>
            <p>
              Remaining Busts:{" "}
              <span className="font-bold">{remainingBusts}</span>
            </p>
            <p>
              Credits: <span className="font-bold">{credits}</span>
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Grid
              grid={grid}
              onCellClick={handleCellClick}
              peep={peep}
              focusedMode={focusedMode}
            />
            <div>
              <button
                style={{ boxShadow: "0 0 50px 0 rgba(37,99,235,0.2)" }}
                className="z-40 bg-gradient-to-br from-fuchsia-500 to-fuchsia-800 text-center text-white px-4 py-2 rounded-lg min-w-fit hover:brightness-95 transition-all duration-150"
                onClick={() => {
                  setFocusedMode(!focusedMode);
                }}
              >
                Focused mode
              </button>
            </div>
          </div>
        </div>
      </div>
      <Modal
        backdrop="opaque"
        isOpen={WinIsOpen}
        onOpenChange={OnOpenWinChange}
        hideCloseButton
        isDismissable={false}
        radius="lg"
        classNames={{
          body: "pt-2 pb-2",
          backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
          base: "border-[#292f46] bg-white dark:bg-[#19172c] text-gray-700 max-w-xl",
          closeButton: "hover:bg-white/5 active:bg-white/10",
          footer: "pt-2",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center justify-center gap-1">
                <p className="text-2xl">You won!</p>
              </ModalHeader>
              <ModalBody className="pb-4">
                <div className="flex flex-col">
                  <p className="text-center mb-5">
                    You have successfully busted the ghost. Congratulations!
                  </p>
                  <div className="flex items-center justify-center">
                    <button
                      style={{ boxShadow: "0 0 50px 0 rgba(37,99,235,0.2)" }}
                      className="w-fit px-8 z-40 bg-gradient-to-br from-[#06b7f9] to-[#194aec] text-center text-white py-2 rounded-lg min-w-fit hover:brightness-95 transition-all duration-150"
                      onClick={() => {
                        setGrid(initialGridState());
                        setCredits(NUMBER_OF_CREDITS);
                        setRemainingBusts(NUMBER_OF_BUSTS);
                        const [x, y] = placeGhost();
                        setGhost([x, y]);
                        onClose();
                      }}
                    >
                      Restart
                    </button>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        backdrop="opaque"
        isOpen={GameOverIsOpen}
        onOpenChange={OnOpenGameOverChange}
        hideCloseButton
        isDismissable={false}
        radius="lg"
        classNames={{
          body: "pt-2 pb-2",
          backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
          base: "border-[#292f46] bg-white dark:bg-[#19172c] text-gray-700 max-w-xl",
          closeButton: "hover:bg-white/5 active:bg-white/10",
          footer: "pt-2",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center justify-center gap-1">
                <p className="text-2xl">Game Over</p>
              </ModalHeader>
              <ModalBody className="pb-4">
                <div className="flex flex-col">
                  <p className="text-center">
                    You have run out of credits. Restart the game to play again.
                  </p>
                  <p className="font-semibold text-center mb-5">
                    (Ghost was at {ghost[0]}, {ghost[1]})
                  </p>
                  <div className="flex items-center justify-center">
                    <button
                      style={{ boxShadow: "0 0 50px 0 rgba(37,99,235,0.2)" }}
                      className="w-fit px-8 z-40 bg-gradient-to-br from-[#06b7f9] to-[#194aec] text-center text-white py-2 rounded-lg min-w-fit hover:brightness-95 transition-all duration-150"
                      onClick={() => {
                        setGrid(initialGridState());
                        setCredits(NUMBER_OF_CREDITS);
                        setRemainingBusts(2);
                        const [x, y] = placeGhost();
                        setGhost([x, y]);
                        onClose();
                      }}
                    >
                      Restart
                    </button>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
