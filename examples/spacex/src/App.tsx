import React from "react";
import "./App.css";
import { observer } from "mobx-react-lite";
import objectManager, { Company, Dragon } from "./Store";

// @ts-expect-error
window.objectManager = objectManager;

const dragon1 = objectManager.getList(Dragon).get("dragon1");
const company = objectManager.getObject(Company);

function DragonView({ dragon }: { dragon: Dragon }) {
  return (
    <>
      <p>{dragon.id}</p>
      <p>Active: {dragon.active}</p>
      <p>Crew Capacity: {dragon.crew_capacity}</p>
      <p>Description: {dragon.description}</p>
      <p>Diameter:</p>
      <ul>
        <li>Feet: {dragon.diameter.feet}</li>
        <li>Meters: {dragon.diameter.meters}</li>
      </ul>
    </>
  );
}

const DragonObserver = observer(DragonView);

function CompanyView({ company }: { company: Company }) {
  return (
    <>
      <p>Company Info {company.isLoadingProps && <p>Loading info...</p>}</p>
      <p>CEO: {company.ceo}</p>
      <p>COO: {company.coo}</p>
    </>
  );
}

const CompanyObserver = observer(CompanyView);

function App() {
  return (
    <div className="App">
      <DragonObserver dragon={dragon1} />
      <CompanyObserver company={company} />
    </div>
  );
}

export default App;
