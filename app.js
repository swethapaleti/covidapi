const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
app.use(express.json());

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDBandServer();

const getAllStates = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const getDistricts = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

const getCases = (obj) => {
  return {
    totalCases: obj.cases,
    totalCured: obj.cured,
    totalActive: obj.active,
    totalDeaths: obj.deaths,
  };
};

const stateName = (obj) => {
  return {
    stateName: obj.state_name,
  };
};

app.get("/states/", async (request, response) => {
  const getStates = `SELECT * from state;`;
  const stateArray = await db.all(getStates);
  console.log(stateArray);
  response.send(
    stateArray.map((eachItem) => {
      return getAllStates(eachItem);
      console.log(eachItem);
    })
  );
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStates = `SELECT * from state WHERE state_id = ${stateId};`;
  const stateArray = await db.get(getStates);
  response.send(getAllStates(stateArray));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrict = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const getDistrictArray = await db.run(addDistrict);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT * from district WHERE district_id = ${districtId};`;
  const getDistrictArray = await db.get(getDistrict);
  response.send(getDistricts(getDistrictArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictDB = `DELETE from district WHERE district_id = ${districtId};`;
  const deleteItem = await db.run(deleteDistrictDB);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const newDistrict = `UPDATE district SET district_name ='${districtName}',
    state_id = ${stateId}, cases = ${cases}, cured=${cured}, active = ${active},
    deaths = ${deaths}; WHERE district_id =${districtId};`;
  const addNewDistrict = await db.run(newDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateInfo = `SELECT sum(cases) as cases,sum(cured) as cured,sum(active) as active,sum(deaths) as deaths from district WHERE state_id=${stateId};`;
  const getStateCases = await db.get(getStateInfo);
  response.send(getCases(getStateCases));
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateId = `SELECT state_id from district WHERE district_id = ${districtId};`;
  const getStateIdDb = await db.get(getStateId);
  const getStateNameDb = `SELECT state_name from state WHERE state_id = ${getStateIdDb.state_id};`;
  const getStateNameResult = await db.get(getStateNameDb);
  response.send(stateName(getStateNameResult));
});

module.exports = app;
