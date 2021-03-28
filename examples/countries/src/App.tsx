import React from "react";
import "./App.css";
import { observer } from "mobx-react-lite";
import objectManager, { Continent } from "./Store";

// @ts-expect-error
window.objectManager = objectManager;

const continentNA = objectManager.getList(Continent).get("NA");

function ContinentView({ continent }: { continent: Continent }) {
  return (
    <>
      <p>{continent.name}</p>
      <p>Countries:</p>
      <ul>
        {continent.countries.map((country) => (
          <li key={country.code}>
            {country.emoji} - {country.name}
          </li>
        ))}
      </ul>
    </>
  );
}

const ContinentObserver = observer(ContinentView);

function App() {
  return (
    <div className="App">
      <ContinentObserver continent={continentNA} />
    </div>
  );
}

export default App;
