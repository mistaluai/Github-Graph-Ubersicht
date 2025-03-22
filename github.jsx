// --- USER SETTINGS ---
const githubUsername = "";
const githubToken = "";

// Set the widget width in pixels (this determines how many weeks are shown)
const widgetWidth = 400; // e.g., 300px width

// Position settings (adjust these to move the widget)
const widgetLeft = 10; // pixels from the left
const widgetTop = 650; // pixels from the top

// Refresh every hour (3600000 ms)
export const refreshFrequency = 3600000;

// --- GraphQL Query ---
const query = `
{
  user(login: "${githubUsername}") {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
`;

// --- Utility: Map contribution count to a dark mode fill color ---
const getColor = (count) => {
  if (count === 0)
    return "#161b22"; // Very dark (no contributions)
  else if (count >= 1 && count < 10) return "#0e4429";
  else if (count >= 10 && count < 20) return "#006d32";
  else if (count >= 20 && count < 30) return "#26a641";
  else return "#39d353";
};

// --- Utility: Generate an SVG grid from the weeks data ---
// This function now uses `widgetWidth` to calculate how many weeks to show.
const generateSVG = (weeks) => {
  const cellSize = 12; // Size of each square
  const cellMargin = 2; // Gap between squares
  // Calculate how many weeks can fit into widgetWidth:
  const weeksToShow = Math.floor(widgetWidth / (cellSize + cellMargin));
  // Use the most recent weeks (GitHub returns weeks oldest to newest)
  const displayWeeks = weeks.slice(-weeksToShow);
  const numDays = 7; // Always 7 days (rows)
  const width = displayWeeks.length * (cellSize + cellMargin);
  const height = numDays * (cellSize + cellMargin);
  let svgCells = "";

  displayWeeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day, dayIndex) => {
      const x = weekIndex * (cellSize + cellMargin);
      const y = dayIndex * (cellSize + cellMargin);
      const fill = getColor(day.contributionCount);
      svgCells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" data-date="${day.date}" data-count="${day.contributionCount}"></rect>`;
    });
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgCells}</svg>`;
};

// --- Fetch contributions using GitHub GraphQL API ---
export const command = async (dispatch) => {
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${githubToken}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const weeks =
      result.data.user.contributionsCollection.contributionCalendar.weeks;
    const svg = generateSVG(weeks);
    dispatch({ type: "SET_SVG", svg });
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    dispatch({
      type: "SET_SVG",
      svg: `<p style="color: red;">Error loading contributions graph. Check your token and username.</p>`,
    });
  }
};

export const initialState = { svg: "" };

export const updateState = (event, previousState) => {
  switch (event.type) {
    case "SET_SVG":
      return { ...previousState, svg: event.svg };
    default:
      return previousState;
  }
};

// --- Styling ---
import { css } from "uebersicht";

const container = css`
  position: absolute;
  left: ${widgetLeft}px;
  top: ${widgetTop}px;
  width: ${widgetWidth}px; /* Ensure the container matches the desired width */
  padding: 10px;
  background-color: #24292e; /* Dark background */
  border-radius: 8px;
  color: #fff;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const heading = css`
  font-size: 18px;
  margin-bottom: 5px;
  margin-top: -5px;
`;

// --- Render Widget ---
export const render = ({ svg }) => {
  return (
    <div className={container}>
      <h1 className={heading}>GitHub</h1>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
};
