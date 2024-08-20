/* eslint-disable */

import React, { useCallback, useEffect, useRef, useState } from 'react'; //cks modified
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import {
  MeasurementsIPCName,
  MeasurementData,
} from '../mainRendererShared/ipcSignatures/measurementsIPCSignatures';
// Replace with your actual imports and setup
const { ipcRenderer } = window.electron;
// import { ipcRenderer } from 'electron';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LineChart from './LineChart';

function SimulationPanel() {
  // Chart.register(zoomPlugin, CategoryScale, LineElement, LinearScale, PointElement);
  const [volume, setVolume] = React.useState(0.0);
  const [simulationData, setSimulationData] =
    React.useState<MeasurementData | null>(null);
  const [showX, setShowX] = React.useState<boolean | undefined>(true);
  const [showY, setShowY] = React.useState<boolean | undefined>(true);
  const [showZ, setShowZ] = React.useState<boolean | undefined>(true);
  const [chartData, setChartData] = React.useState<any | object>({});
  const [maxValue, setMaxValue] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [resetGraph, setResetGraph] = useState(false);
  const [connections, setConnections] = useState([]);
  const [connect, setConnect] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Function to find the maximum value in nested arrays
  const findMaxValueInNestedArray = (
    nestedArray: number[][] | undefined,
  ): number => {
    if (!Array.isArray(nestedArray) || nestedArray.length === 0)
      return -Infinity; // Return a very low number if the array is undefined, not an array, or empty
    return Math.max(...nestedArray.flat());
  };

  useEffect(() => {
    // Calculate and set maximum values
    const max1 = findMaxValueInNestedArray(chartData?.xG);
    const max2 = findMaxValueInNestedArray(chartData?.yG);
    const max3 = findMaxValueInNestedArray(chartData?.zG);

    // Set the maximum value state
    setMaxValue(Math.max(max1, max2, max3));
  }, [chartData]);

  const handleButtonClick = async () => {
    const trackTitle = 'Dummy';

    const result = ipcRenderer.measurements.sendWithResponse(
      MeasurementsIPCName.START,
      trackTitle,
    );
  };

  const handleExportClick = async (fileType: string) => {
    const filePath = await window.electron.ipcRenderer.showSaveDialog(fileType);
    if (filePath) {
      if (fileType === 'png') {
        console.log(`Image File path chosen: ${filePath}`);
        ipcRenderer.measurements.sendWithResponse(
          MeasurementsIPCName.EXPORT_PNG,
          chartData,
          filePath,
        );
      }
      if (fileType === 'csv') {
        console.log(`CSV File path chosen: ${filePath}`);
        ipcRenderer.measurements.sendWithResponse(
          MeasurementsIPCName.EXPORT_CSV,
          chartData,
          filePath,
        );
      }
    }
  };

  const handleConnectionSelect = async (event: any) => {
    try {
      setDropdownOpen(false);
      // const selectedValue = event.target.value;
      const selectedValue = event;
      const [selectedName, selectedId] = selectedValue.split('|');
      if (selectedName === 'disconnect') {
        // If connection is already selected
        if (selectedDevice !== '') {
          await ipcRenderer.measurements
            .sendWithResponse(MeasurementsIPCName.DISCONNECT, connect)
            .then((res) => {})
            .catch((error) => {
              toast.error(`Failed ${error.message}`);
            });
        }
        setSelectedDevice('');
      } else {
        setSelectedDevice(selectedName);
        setConnect({ id: selectedId, name: selectedName });
        const selectedConnection = {
          id: selectedId,
          name: selectedName,
        };
        // If connection is already selected
        if (selectedDevice !== '') {
          await ipcRenderer.measurements
            .sendWithResponse(MeasurementsIPCName.DISCONNECT, connect)
            .then((res) => {})
            .catch((error) => {
              toast.error(`Failed ${error.message}`);
            });
        }
        // Select connection
        await ipcRenderer.measurements
          .sendWithResponse(
            MeasurementsIPCName.SELECT_CONNECTION,
            selectedConnection,
          )
          .then((res) => {})
          .catch((error) => {
            toast.error(`Failed ${error.message}`);
          });
      }
    } catch (error: any) {
      console.log(error);
      toast.error(`Connection selection failed: ${error.message}`);
    }
  };

  useEffect(() => {
    try {
      ipcRenderer.measurements
        .sendWithResponse(MeasurementsIPCName.START, title)
        .then((res) => {})
        .catch((error) => {
          toast.error(`Failed ${error.message}`);
        });

      ipcRenderer.measurements
        .sendWithResponse(MeasurementsIPCName.GET_CONNECTIONS_LIST)
        .then((connections: any) => {
          // console.log('connections', connections);
          setConnections(connections);
        })
        .catch((error) => {
          // console.log('GET_CONNECTIONS_LIST', error);
          toast.error(`Failed ${error.message}`);
        });

      ipcRenderer.measurements
        .sendWithResponse(MeasurementsIPCName.DISCONNECT)
        .then((res) => {})
        .catch((error) => {
          // console.log('DISCONNECT', error);
          toast.error(`Failed ${error.message}`);
        });

      ipcRenderer.measurements
        .sendWithResponse(MeasurementsIPCName.DISCONNECTED)
        .then((res) => {})
        .catch((error) => {
          toast.error(`Failed ${error.message}`);
        });

      ipcRenderer.measurements.on('user-disconnect', () => {
        console.log('user disconnected renderer');
        const selectedConnection = {
          id: connect?.selectedId,
          name: connect?.selectedName,
        };
        ipcRenderer.measurements.on(
          MeasurementsIPCName.DISCONNECTED,
          selectedConnection,
        );
      });

      ipcRenderer.measurements.on(MeasurementsIPCName.NEW_DATA, (data) => {
        // console.log('NEW_DATA', data);
        setChartData(data);
      });
    } catch (error) {
      // toast.error(`Failed ${error.message}`);
    }
  }, []);

  return (
    <div className="simulationPage">
      <div className="chartSection">
        <div className="chartSectionHeader">
          <p className="textStrong">Track title XYZ</p>
          <div className="scrollSection">
            <svg
              width="20"
              height="21"
              viewBox="0 0 20 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => {
                setResetGraph(!resetGraph);
              }}
              style={{ cursor: 'pointer' }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.1522 0.370658C12.9489 0.36828 12.7527 0.446745 12.6077 0.589407C12.4626 0.732069 12.3806 0.928236 12.3806 1.13151C12.3806 1.33478 12.4626 1.52978 12.6077 1.67361C12.7527 1.81627 12.9489 1.89474 13.1522 1.89236H18.4782V7.21842C18.4759 7.42171 18.5543 7.61787 18.697 7.76292C18.8408 7.90796 19.0358 7.98999 19.2391 7.98999C19.4424 7.98999 19.6386 7.90796 19.7812 7.76292C19.9239 7.61788 20.0023 7.42172 19.9999 7.21842V1.13149C19.9999 0.71183 19.6587 0.370628 19.2391 0.370628L13.1522 0.370658ZM5.54353 6.45758C5.12387 6.45758 4.78267 6.79879 4.78267 7.21845V13.3054C4.78267 13.725 5.12387 14.0662 5.54353 14.0662H14.6739C15.0936 14.0662 15.4348 13.725 15.4348 13.3054V7.21845C15.4348 6.79879 15.0936 6.45758 14.6739 6.45758H5.54353ZM6.3044 7.97931H13.9131V12.5445H6.3044V7.97931ZM0.967687 12.5445C0.765583 12.5469 0.57298 12.6301 0.432707 12.7751C0.291235 12.9202 0.213959 13.1152 0.217525 13.3161V19.403C0.217525 19.8238 0.558728 20.1638 0.978391 20.1638H7.06532C7.26861 20.1674 7.46477 20.089 7.60982 19.9451C7.75486 19.8024 7.83689 19.6075 7.83689 19.403C7.83689 19.1997 7.75486 19.0047 7.60982 18.8621C7.46478 18.7182 7.26862 18.6398 7.06532 18.6421H1.73926V13.3161C1.74282 13.1104 1.66198 12.9131 1.51694 12.7668C1.37071 12.6218 1.17336 12.5409 0.967687 12.5445Z"
                fill="#595959"
              />
            </svg>
            <input
              type="range"
              min={0}
              max={0.99}
              step={0.02}
              value={volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
              }}
              className="range"
            />
          </div>
        </div>
        <div className="chartMain">
          <div className="ruler_bg">
            <div className="x_Axes">
              <div className="badge" />
              <div className="axes">
                <span className="lbl_hint">[ms]</span>
              </div>
            </div>

            <div className="content">
              <div className="y_Axes">
                <label className="lbl_hint">[g]</label>
              </div>
              <div className="chart_bg" />
            </div>
          </div>
          <div style={{ width: '100%', height: '100%' }}>
            <LineChart
              data={chartData}
              showX={showX}
              showY={showY}
              showZ={showZ}
              zoomLevel={volume}
              resetGraph={resetGraph}
            />
          </div>

          <div className="ruler_yaxes_hide_badge" />
        </div>
      </div>
      <div className="controlPanel" style={{ overflow: 'scroll' }}>
        <div>
          <div className="dataSection">
            <p
              className="textStrong"
              style={{ marginTop: '12px', marginBottom: '16px' }}
            >
              Data
            </p>
            <div className="flexBetween">
              <p className="textGray textNoMargin textData">Max value</p>
              <p className="textMedium textNoMargin textDataValue">
                {Math.round(maxValue)} g
              </p>
            </div>
            <div className="flexBetween" style={{ marginTop: '16px' }}>
              <p className="textGray textData textNoMargin">Track ID</p>
              <p className="textMedium textNoMargin textDataValue">
                Track title XYZ
              </p>
            </div>
          </div>
          <div className="switchSection viewSection">
            <p
              className="textStrong"
              style={{ marginTop: '10px', marginBottom: '10px' }}
            >
              View
            </p>
            <div className="flexBetween">
              <label className="textGray textNoMargin textData">X-Axis</label>
              <label className="switch" htmlFor="xAxisCheck">
                <input
                  id="xAxisCheck"
                  type="checkbox"
                  checked={showX}
                  onChange={() => setShowX(!showX)}
                />
                <span className="slider round" />
              </label>
            </div>
            <div className="flexBetween mt_12">
              <label className="textGray textNoMargin textData">Y-Axis</label>
              <label className="switch" htmlFor="yAxisCheck">
                <input
                  id="yAxisCheck"
                  type="checkbox"
                  checked={showY}
                  onChange={() => setShowY(!showY)}
                />
                <span className="slider round" />
              </label>
            </div>
            <div className="flexBetween mt_12">
              <label className="textGray textNoMargin textData">Z-Axis</label>
              <label className="switch" htmlFor="zAxisCheck">
                <input
                  id="zAxisCheck"
                  type="checkbox"
                  checked={showZ}
                  onChange={() => setShowZ(!showZ)}
                />
                <span className="slider round" />
              </label>
            </div>
            <div className="modeSelectSection">
              <label className="textGray textNoMargin textData">Mode</label>
              <select
                id="modeSelect"
                className="textGray font_medium"
                style={{ height: '23px' }}
              >
                <option>RMS</option>
              </select>
            </div>
          </div>
          <div className="legacySection">
            <p
              className="textStrong"
              style={{ marginTop: '10px', marginBottom: '13px' }}
            >
              Legacy
            </p>
            <div>
              <div className="flexBetween">
                <input
                  type="text"
                  className="textGray legacyLabel textNoMargin textData"
                  placeholder="Track Title"
                  style={{ width: '100%', border: 'none' }}
                  onChange={(e) => setTitle(e.target.value)}
                  value={title}
                />
              </div>
              <div className="duration mt_8">
                <p
                  className="textGray legacyLabel textData textNoMargin"
                  style={{ width: '63%' }}
                >
                  Duration
                </p>
                <button
                  type="button"
                  className="playBtn"
                  style={{
                    width: '28%',
                    opacity: selectedDevice === '' ? 0.5 : 1,
                  }}
                  onClick={handleButtonClick}
                  disabled={selectedDevice === ''}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 17 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.5896 7.94563L4.59584 2.44563C4.52013 2.39892 4.43333 2.37327 4.3444 2.3713C4.25546 2.36933 4.16762 2.39113 4.08991 2.43444C4.01221 2.47775 3.94747 2.541 3.90237 2.61768C3.85727 2.69435 3.83344 2.78167 3.83334 2.87063V13.8706C3.83344 13.9596 3.85727 14.0469 3.90237 14.1236C3.94747 14.2003 4.01221 14.2635 4.08991 14.3068C4.16762 14.3501 4.25546 14.3719 4.3444 14.37C4.43333 14.368 4.52013 14.3423 4.59584 14.2956L13.5896 8.79563C13.6634 8.75196 13.7246 8.68979 13.7672 8.61527C13.8097 8.54074 13.832 8.45643 13.832 8.37063C13.832 8.28483 13.8097 8.20051 13.7672 8.12599C13.7246 8.05146 13.6634 7.9893 13.5896 7.94563Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="controlBtnGroup">
                <button className="controlBtn" onClick={() => setChartData({})}>
                  Clear
                </button>
                <div>
                  <button
                    className="controlBtn"
                    onClick={() => handleExportClick('png')}
                  >
                    Export PNG
                  </button>
                </div>
                <button className="controlBtn">Copy to Clipboard</button>
                <div style={{ marginBottom: '10px' }}>
                  <button
                    className="controlBtn"
                    onClick={() => handleExportClick('csv')}
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="deviceSection">
          <p
            className="textStrong"
            style={{ marginTop: '12px', marginBottom: '12px' }}
          >
            Devices
          </p>

          <div style={{ position: 'relative' }}>
            {/* The button that toggles the dropdown */}
            <button
              className="sensorBtn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div style={{ cursor: 'pointer' }}>
                <label style={{ cursor: 'pointer' }}>Connected to </label>
                <label
                  style={{ cursor: 'pointer' }}
                  className="font_medium block"
                >
                  {selectedDevice}
                </label>
              </div>
              <svg
                style={{ marginLeft: 'auto' }}
                width="34"
                height="34"
                viewBox="0 0 34 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M23.9941 12.4438L23.9941 10.9166C23.9941 7.60286 21.3078 4.91656 17.9941 4.91656L6.10614 4.91656C3.01157 4.91656 0.50293 7.4252 0.50293 10.5198V10.5198L0.50293 22.5882V22.5882C0.50293 25.6828 3.01156 28.1914 6.10613 28.1914L17.9941 28.1914C21.3078 28.1914 23.9941 25.5051 23.9941 22.1914L23.9941 20.3176"
                  stroke="#595959"
                />
                <path
                  d="M4.16785 16.9853H4.20828C5.31285 16.9853 6.20828 17.8807 6.20828 18.9853V20.2814C6.20828 20.9315 6.73533 21.4586 7.38547 21.4586V21.4586C8.03562 21.4586 8.56267 20.9315 8.56267 20.2814V12.7082C8.56267 12.1231 9.037 11.6487 9.62213 11.6487V11.6487C10.2073 11.6487 10.6816 12.1231 10.6816 12.7082V15.3372C10.6816 16.2474 11.4194 16.9853 12.3296 16.9853V16.9853"
                  stroke="#595959"
                  strokeLinecap="round"
                />
                <path
                  d="M30.196 17.515C30.6103 17.515 30.946 17.1792 30.946 16.765C30.946 16.3507 30.6103 16.015 30.196 16.015V17.515ZM14.5489 16.2346C14.256 16.5275 14.256 17.0024 14.5489 17.2953L19.3219 22.0683C19.6148 22.3611 20.0896 22.3611 20.3825 22.0683C20.6754 21.7754 20.6754 21.3005 20.3825 21.0076L16.1399 16.765L20.3825 12.5223C20.6754 12.2294 20.6754 11.7545 20.3825 11.4617C20.0896 11.1688 19.6148 11.1688 19.3219 11.4617L14.5489 16.2346ZM30.196 16.015H15.0792V17.515H30.196V16.015Z"
                  fill="#FCBC3F"
                />
              </svg>
            </button>

            {/* The dropdown menu */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 2,
                  marginTop: '5px',
                }}
              >
                {/* Disconnect option */}
                {selectedDevice !== '' && (
                  <div
                    onClick={() =>
                      handleConnectionSelect(`${'disconnect'}|${'disconnect'}`)
                    }
                    className="dropdown-item"
                    style={{ color: 'red', fontWeight: 'bold' }} // Optional: style to highlight disconnect
                  >
                    Disconnect
                  </div>
                )}
                {connections.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      handleConnectionSelect(`${item.name}|${item.id}`)
                    }
                    className="dropdown-item"
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SimulationPanel />} />
      </Routes>
    </Router>
  );
}
