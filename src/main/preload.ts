// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';
import { createIPCRendererFunctions } from '../mainRendererShared/ipcSignatures/ipcFunctionsGenerator';
import { MeasurementsIPCSignatureMap } from '../mainRendererShared/ipcSignatures/measurementsIPCSignatures';

const measurementsIPCRendererFunctions =
  createIPCRendererFunctions<MeasurementsIPCSignatureMap>();

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    measurements: measurementsIPCRendererFunctions,
    showSaveDialog: async (fileType: any) => {
      const filePath = await ipcRenderer.invoke('show-save-dialog', fileType);
      return filePath;
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
