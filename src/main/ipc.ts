import { createIPCMainFunctions } from '../mainRendererShared/ipcSignatures/ipcFunctionsGenerator';
import { MeasurementsIPCSignatureMap } from '../mainRendererShared/ipcSignatures/measurementsIPCSignatures';

// eslint-disable-next-line import/prefer-default-export
export const measurementsIPC =
  createIPCMainFunctions<MeasurementsIPCSignatureMap>();
