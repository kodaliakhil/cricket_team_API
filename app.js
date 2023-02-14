const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// API 1
// Path: /states/
// Method: GET
// Returns a list of all states in the state table

app.get("/states/", async (req, res) => {
  const getAllStatesQuery = `
        SELECT 
            state_id AS stateId,
            state_name AS stateName,
            population AS population
        FROM state
    `;
  const statesList = await db.all(getAllStatesQuery);
  res.send(statesList);
});

// API 2
// Path: /states/:stateId/
// Method: GET
// Returns a state based on the state ID

app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const getStateDetails = `
        SELECT
            state_id AS stateId,
            state_name AS stateName,
            population AS population
        FROM state
        WHERE state_id = ${stateId};
    `;
  const stateDetails = await db.get(getStateDetails);
  res.send(stateDetails);
});

// API 3  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// Path: /districts/
// Method: POST
// Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (req, res) => {
  const districtDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictDetails = `
        INSERT INTO 
            district (district_name,state_id,cases,cured,active,deaths)
        VALUES 
            (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
            );
    `;
  const dbResponse = await db.run(postDistrictDetails);
  const districtId = dbResponse.lastID;
  res.send("District Successfully Added");
});

// API 4
// Path: /districts/:districtId/
// Method: GET
// Returns a district based on the district ID

app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictDetailsQuery = `
        SELECT 
            district_id AS districtId,
            district_name AS districtName,
            state_id AS stateId,
            cases AS cases,
            cured,
            active,
            deaths
        FROM district 
        WHERE district_id = ${districtId};
    `;
  const distDetails = await db.get(getDistrictDetailsQuery);
  res.send(distDetails);
});

// API 5
// Path: /districts/:districtId/
// Method: DELETE
// Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const deleteDistrictQuery = `
        DELETE 
        FROM 
            district
        WHERE district_id = ${districtId};
    `;
  await db.run(deleteDistrictQuery);
  res.send("District Removed");
});

// API 6 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// Path: /districts/:districtId/
// Method: PUT
// Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const updateDistrictQuery = `
        UPDATE district
        SET 
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  res.send("District Details Updated");
});

// API 7
// Path: /states/:stateId/stats/
// Method: GET
// Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats", async (req, res) => {
  const { stateId } = req.params;
  const getStatsQuery = `
        SELECT 
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM district
        WHERE state_id = ${stateId};
    `;
  const stats = await db.all(getStatsQuery);
  res.send(stats);
});

// API 8
// Path: /districts/:districtId/details/
// Method: GET
// Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details", async (req, res) => {
  const { districtId } = req.params;
  const getDetailsQuery = `
        SELECT 
            state_name AS stateName
        FROM district LEFT JOIN state ON district.state_id = state.state_id
        WHERE district_id = ${districtId};
    `;
  const details = await db.all(getDetailsQuery);
  res.send(details);
});

module.exports = app;
