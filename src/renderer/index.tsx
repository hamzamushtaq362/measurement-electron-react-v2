import { createRoot } from 'react-dom/client';
import App from './App';
import { MeasurementsIPCName } from '../mainRendererShared/ipcSignatures/measurementsIPCSignatures';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// Use the ipc functions like this:
// console.log(
//   window.electron.ipcRenderer.measurements.sendWithResponse(
//     MeasurementsIPCName.GET_CONNECTIONS_LIST,
//   ),
// );
// See all definitions at src/mainRendererShared/ipcSignatures/measurementsIPCSignatures.ts
