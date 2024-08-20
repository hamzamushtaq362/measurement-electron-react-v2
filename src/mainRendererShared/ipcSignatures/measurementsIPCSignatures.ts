export interface MeasurementData {
  timestampsUS: number[];
  xG: number[];
  yG: number[];
  zG: number[];
}

export interface Connection {
  id: string;
  name: string;
}

export enum MeasurementsIPCName {
  NEW_DATA = 'measurements-new-data',
  EXPORT_PNG = 'measurements-export-png',
  EXPORT_CSV = 'measurements-export-csv',
  START = 'measurements-start',
  GET_CONNECTIONS_LIST = 'measurements-get-connections-list',
  SELECT_CONNECTION = 'measurements-select-connection',
  DISCONNECT = 'measurements-disconnect',
  DISCONNECTED = 'measurements-disconnected',
}

export type MeasurementsIPCSignatureMap = {
  rendererToMainWithResponse: {
    [MeasurementsIPCName.GET_CONNECTIONS_LIST]: {
      argTypes: [];
      returnType: Connection[];
    };
    [MeasurementsIPCName.EXPORT_PNG]: {
      argTypes: [MeasurementData, string];
      returnType: void;
    };
    [MeasurementsIPCName.EXPORT_CSV]: {
      argTypes: [MeasurementData, string];
      returnType: void;
    };
    [MeasurementsIPCName.START]: {
      argTypes: [string];
      returnType: void;
    };
    [MeasurementsIPCName.SELECT_CONNECTION]: {
      argTypes: [Connection];
      returnType: void;
    };
    [MeasurementsIPCName.DISCONNECT]: {
      argTypes: [Connection];
      returnType: void;
    };
  };
  rendererToMainWithoutResponse: {};
  mainToRendererWithResponse: {};
  mainToRendererWithoutResponse: {
    [MeasurementsIPCName.NEW_DATA]: {
      argTypes: [MeasurementData];
    };
    [MeasurementsIPCName.DISCONNECTED]: {
      argTypes: [Connection];
    };
  };
};
