import crypto from 'crypto';
import { dialog, WebContents } from 'electron';
import { measurementsIPC } from './ipc';
import {
  Connection,
  MeasurementsIPCName,
} from '../mainRendererShared/ipcSignatures/measurementsIPCSignatures';

function failSometimes() {
  if (Math.random() < 0.1) {
    throw new Error('Operation failed!');
  }
}

export default class MeasurementSimulator {
  private readonly removeAllHandlers: () => void;

  constructor(webContents: WebContents) {
    const removePNGExportHandler = measurementsIPC.handle(
      MeasurementsIPCName.EXPORT_PNG,
      async (measurementData, filename): Promise<void> => {
        failSometimes();
        console.log('Exporting PNG', measurementData, filename);
      },
    );

    const removeCSVExportHandler = measurementsIPC.handle(
      MeasurementsIPCName.EXPORT_CSV,
      async (measurementData, filename): Promise<void> => {
        failSometimes();
        console.log('Exporting CSV', measurementData, filename);
      },
    );

    const removeStartHandler = measurementsIPC.handle(
      MeasurementsIPCName.START,
      async (connectionId): Promise<void> => {
        failSometimes();
        console.log('Starting measurement', connectionId);
        setTimeout(() => {
          measurementsIPC.sendWithoutResponse(
            webContents,
            MeasurementsIPCName.NEW_DATA,
            MeasurementSimulator.createData(),
          );
        }, Math.random() * 10000);
      },
    );

    let currentConnectionList: Connection[] = [];
    let currentConnection: Connection | null = null;

    const removeSelectHandler = measurementsIPC.handle(
      MeasurementsIPCName.SELECT_CONNECTION,
      async (connection): Promise<void> => {
        if (currentConnection !== null) {
          throw new Error('Already connected');
        } else if (
          !currentConnectionList.some(
            (connectionInList) =>
              connectionInList.id === connection.id &&
              connection.name === connectionInList.name,
          )
        ) {
          throw new Error('Connection not available');
        }

        failSometimes();
        console.log('Selecting connection', connection);
        currentConnection = connection;

        if (Math.random() < 0.3) {
          setTimeout(() => {
            currentConnection = null;
            measurementsIPC.sendWithoutResponse(
              webContents,
              MeasurementsIPCName.DISCONNECTED,
              connection,
            );
          }, Math.random() * 100000);
        }
      },
    );

    const removeDisconnectHandler = measurementsIPC.handle(
      MeasurementsIPCName.DISCONNECT,
      async (connection): Promise<void> => {
        if (currentConnection === null) {
          throw new Error('Not connected');
          // dialog.showErrorBox('Connection Error', 'Not connected');
        } else if (currentConnection?.id !== connection?.id) {
          throw new Error('Wrong connection');
        }
        failSometimes();
        console.log('Disconnecting', connection);
        currentConnection = null;
      },
    );

    const removeConnectionListHandler = measurementsIPC.handle(
      MeasurementsIPCName.GET_CONNECTIONS_LIST,
      async () => {
        failSometimes();

        currentConnectionList = [
          {
            id: crypto.randomUUID(),
            name: MeasurementSimulator.createCoolName(),
          },
          {
            id: crypto.randomUUID(),
            name: MeasurementSimulator.createCoolName(),
          },
          {
            id: crypto.randomUUID(),
            name: MeasurementSimulator.createCoolName(),
          },
        ];
        if (currentConnection !== null) {
          currentConnectionList.push(currentConnection);
        }

        // Unique connections
        currentConnectionList = [...new Set(currentConnectionList)];

        return currentConnectionList;
      },
    );

    this.removeAllHandlers = () => {
      removePNGExportHandler();
      removeCSVExportHandler();
      removeStartHandler();
      removeSelectHandler();
      removeDisconnectHandler();
      removeConnectionListHandler();
    };
  }

  public destructor(): void {
    this.removeAllHandlers();
  }

  private static createCoolName() {
    const adjectives = [
      'Red',
      'Blue',
      'Green',
      'Yellow',
      'Black',
      'White',
      'Orange',
      'Purple',
      'Pink',
      'Brown',
    ];

    const nouns = [
      'Car',
      'House',
      'Tree',
      'Cat',
      'Dog',
      'Mouse',
      'Elephant',
      'Lion',
      'Tiger',
      'Bear',
    ];

    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
      nouns[Math.floor(Math.random() * nouns.length)]
    } Connection`;
  }

  private static createData() {
    const pointCount = Math.round(Math.random() * 5000);
    const timeSteps = 500;
    const timestampsUS = new Array(pointCount)
      .fill(0)
      .map((_, i) => i * timeSteps);
    const xG = new Array(pointCount).fill(0).map(() => Math.random());
    const yG = new Array(pointCount).fill(0).map(() => Math.random());
    const zG = new Array(pointCount).fill(0).map(() => Math.random());
    return { timestampsUS, xG, yG, zG };
  }
}
