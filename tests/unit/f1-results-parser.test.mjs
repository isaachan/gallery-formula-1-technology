import { describe, expect, it } from "vitest";

import {
  parseConstructorStandingsPage,
  parseDriverStandingsPage,
  parseRaceResultsPage,
  parseRaceWeekendHeader,
} from "../../tools/content/f1-results-parser.mjs";

const raceResultsHtml = `
  <table>
    <thead>
      <tr>
        <th>Grand Prix</th>
        <th>Date</th>
        <th>Winner</th>
        <th>Team</th>
        <th>Laps</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><a href="/en/results/1980/races/80/argentina/race-result">Argentina</a></td>
        <td>13 Jan</td>
        <td>Alan&nbsp;Jones</td>
        <td>Williams Ford</td>
        <td>53</td>
        <td>1:43:24.380</td>
      </tr>
      <tr>
        <td><a href="/en/results/1980/races/81/brazil/race-result">Brazil</a></td>
        <td>27 Jan</td>
        <td>Rene&nbsp;Arnoux</td>
        <td>Renault</td>
        <td>40</td>
        <td>1:40:01.330</td>
      </tr>
    </tbody>
  </table>
`;

const driverStandingsHtml = `
  <table>
    <thead>
      <tr>
        <th>Pos.</th>
        <th>Driver</th>
        <th>Nationality</th>
        <th>Team</th>
        <th>Pts.</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><a href="/en/results/1981/drivers/NELPIQ01/nelson-piquet">Nelson&nbsp;Piquet</a></td>
        <td>BRA</td>
        <td>Brabham Ford</td>
        <td>50</td>
      </tr>
      <tr>
        <td>DQ</td>
        <td><a href="/en/results/1997/drivers/MICSCH01/michael-schumacher">Michael Schumacher</a></td>
        <td>GER</td>
        <td>Ferrari</td>
        <td>78</td>
      </tr>
    </tbody>
  </table>
`;

const constructorStandingsHtml = `
  <table>
    <thead>
      <tr>
        <th>Pos.</th>
        <th>Team</th>
        <th>Pts.</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td><a href="/en/results/1988/team/McLaren%20Honda">McLaren Honda</a></td>
        <td>199</td>
      </tr>
      <tr>
        <td>10</td>
        <td><a href="/en/results/1988/team/Minardi%20Ford">Minardi Ford</a></td>
        <td>1</td>
      </tr>
    </tbody>
  </table>
`;

const raceWeekendHtml = `
  <div>
    <h1>1980 BELGIAN GRAND PRIX - QUALIFYING</h1>
    <div>
      <p>04 May 1980</p>
      <p>Circuit Zolder, Belgium</p>
    </div>
  </div>
`;

describe("f1-results-parser", () => {
  it("parses the official race results table", () => {
    expect(parseRaceResultsPage(raceResultsHtml)).toEqual([
      {
        grandPrix: "Argentina",
        raceHref: "/en/results/1980/races/80/argentina/race-result",
        date: "13 Jan",
        winner: "Alan Jones",
        team: "Williams Ford",
        laps: "53",
        time: "1:43:24.380",
      },
      {
        grandPrix: "Brazil",
        raceHref: "/en/results/1980/races/81/brazil/race-result",
        date: "27 Jan",
        winner: "Rene Arnoux",
        team: "Renault",
        laps: "40",
        time: "1:40:01.330",
      },
    ]);
  });

  it("parses driver standings while preserving non-numeric positions", () => {
    expect(parseDriverStandingsPage(driverStandingsHtml)).toEqual([
      {
        position: 1,
        driver: "Nelson Piquet",
        driverHref: "/en/results/1981/drivers/NELPIQ01/nelson-piquet",
        nationality: "BRA",
        team: "Brabham Ford",
        points: 50,
      },
      {
        position: "DQ",
        driver: "Michael Schumacher",
        driverHref: "/en/results/1997/drivers/MICSCH01/michael-schumacher",
        nationality: "GER",
        team: "Ferrari",
        points: 78,
      },
    ]);
  });

  it("parses constructor standings rows", () => {
    expect(parseConstructorStandingsPage(constructorStandingsHtml)).toEqual([
      {
        position: 1,
        team: "McLaren Honda",
        teamHref: "/en/results/1988/team/McLaren%20Honda",
        points: 199,
      },
      {
        position: 10,
        team: "Minardi Ford",
        teamHref: "/en/results/1988/team/Minardi%20Ford",
        points: 1,
      },
    ]);
  });

  it("parses the race-weekend heading metadata", () => {
    expect(parseRaceWeekendHeader(raceWeekendHtml)).toEqual({
      heading: "1980 BELGIAN GRAND PRIX - QUALIFYING",
      date: "04 May 1980",
      circuit: "Circuit Zolder, Belgium",
    });
  });
});
