import {
  ipcMain,
  IpcMainEvent,
  IpcMainInvokeEvent,
  ipcRenderer,
  IpcRendererEvent,
  WebContents,
} from 'electron';
import { IPCKeyType, IPCSignatureMap } from './abstractIPCSignatures';

enum IPCRendererResponseStatus {
  Success = 'success',
  Error = 'error',
}

type IPCRendererResponseType<T_expectedType> =
  | { status: IPCRendererResponseStatus.Success; value: T_expectedType }
  | { status: IPCRendererResponseStatus.Error; value: unknown };

type identifierIsUsed<
  ObjectType,
  Identifier extends string,
> = Identifier extends keyof ObjectType ? true : false;

type responseIdentifierCandidate<Identifier extends string> =
  `mainToRendererWithResponseResult:${Identifier}`;

function createMainToRendererWithResponseResponseIdentifier<
  T_ipcSignatureMap extends IPCSignatureMap,
  Key extends keyof T_ipcSignatureMap['mainToRendererWithResponse'] &
    IPCKeyType,
>(identifier: Key): responseIdentifierCandidate<Key> {
  return `mainToRendererWithResponseResult:${identifier}`;
}

type responseIdentifierIsUsed<
  T_ipcSignatureMap extends IPCSignatureMap,
  Key extends keyof T_ipcSignatureMap['mainToRendererWithResponse'] &
    IPCKeyType,
> = identifierIsUsed<
  T_ipcSignatureMap['rendererToMainWithoutResponse'],
  responseIdentifierCandidate<Key>
>;

type assertResponseIdentifierIsNotUsed<
  T_ipcSignatureMap extends IPCSignatureMap,
  Key extends keyof T_ipcSignatureMap['mainToRendererWithResponse'] &
    IPCKeyType,
> = responseIdentifierIsUsed<T_ipcSignatureMap, Key> extends true ? never : Key;

export function createIPCRendererFunctions<
  T_ipcSignatureMap extends IPCSignatureMap,
>() {
  return {
    sendWithoutResponse<
      Key extends keyof T_ipcSignatureMap['rendererToMainWithoutResponse'],
    >(
      identifier: Key & IPCKeyType,
      ...args: T_ipcSignatureMap['rendererToMainWithoutResponse'][Key]['argTypes']
    ): void {
      ipcRenderer.send(identifier, ...args);
    },
    sendWithResponse<
      Key extends keyof T_ipcSignatureMap['rendererToMainWithResponse'],
    >(
      identifier: Key & IPCKeyType,
      ...args: T_ipcSignatureMap['rendererToMainWithResponse'][Key]['argTypes']
    ): Promise<
      T_ipcSignatureMap['rendererToMainWithResponse'][Key]['returnType']
    > {
      return ipcRenderer.invoke(identifier, ...args);
    },
    on<Key extends keyof T_ipcSignatureMap['mainToRendererWithoutResponse']>(
      identifier: Key & IPCKeyType,
      func: (
        ...args: T_ipcSignatureMap['mainToRendererWithoutResponse'][Key]['argTypes']
      ) => void,
    ): () => void {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(identifier, subscription);

      return () => {
        ipcRenderer.removeListener(identifier, subscription);
      };
    },
    handle<
      Key extends keyof T_ipcSignatureMap['mainToRendererWithResponse'] &
        IPCKeyType,
    >(
      identifier: assertResponseIdentifierIsNotUsed<T_ipcSignatureMap, Key>,
      func: (
        ...args: T_ipcSignatureMap['mainToRendererWithResponse'][Key]['argTypes']
      ) => Promise<
        T_ipcSignatureMap['mainToRendererWithResponse'][Key]['returnType']
      >,
    ): () => void {
      const realSubscription = (
        ...args: T_ipcSignatureMap['mainToRendererWithResponse'][Key]['argTypes']
      ): void => {
        // Get the identifier for the response
        const returnIdentifier =
          createMainToRendererWithResponseResponseIdentifier(identifier);

        // Execute the callback
        func(...args)
          .then((result) => {
            // Send the result back
            ipcRenderer.send(returnIdentifier, {
              status: IPCRendererResponseStatus.Success,
              value: result,
            });
            return result;
          })
          .catch((error) => {
            // Send the error back
            ipcRenderer.send(returnIdentifier, {
              status: IPCRendererResponseStatus.Error,
              value: error,
            });
          });
      };
      ipcRenderer.on(identifier, realSubscription);
      return () => {
        ipcRenderer.removeListener(identifier, realSubscription);
      };
    },
  };
}

export function createIPCMainFunctions<
  T_ipcSignatureMap extends IPCSignatureMap,
>() {
  return {
    sendWithoutResponse<
      Key extends keyof T_ipcSignatureMap['mainToRendererWithoutResponse'],
    >(
      webContents: WebContents,
      identifier: Key & IPCKeyType,
      ...args: T_ipcSignatureMap['mainToRendererWithoutResponse'][Key]['argTypes']
    ): void {
      webContents.send(identifier, ...args);
    },
    sendWithResponse<
      Key extends keyof T_ipcSignatureMap['mainToRendererWithResponse'],
    >(
      webContents: WebContents,
      identifier: Key & IPCKeyType,
      ...args: T_ipcSignatureMap['mainToRendererWithResponse'][Key]['argTypes']
    ): Promise<
      T_ipcSignatureMap['mainToRendererWithResponse'][Key]['returnType']
    > {
      return new Promise<
        T_ipcSignatureMap['mainToRendererWithResponse'][Key]['returnType']
      >((resolve, reject) => {
        // Get the identifier for the response
        const returnIdentifier =
          createMainToRendererWithResponseResponseIdentifier(identifier);

        // Create a subscription to the response
        const resultSubscription = (
          _event: IpcRendererEvent,
          result: IPCRendererResponseType<
            T_ipcSignatureMap['mainToRendererWithResponse'][Key]['returnType']
          >,
        ) => {
          // Check if the Promise resolved
          if (result.status === IPCRendererResponseStatus.Success) {
            resolve(result.value);
          } else {
            reject(result.value);
          }
        };

        // Listen for the response
        ipcRenderer.once(returnIdentifier, resultSubscription);

        // Send the message
        webContents.send(identifier, ...args);
      });
    },
    on<Key extends keyof T_ipcSignatureMap['rendererToMainWithoutResponse']>(
      identifier: Key & IPCKeyType,
      func: (
        ...args: T_ipcSignatureMap['rendererToMainWithoutResponse'][Key]['argTypes']
      ) => void,
    ): () => void {
      const subscription = (
        _event: IpcMainEvent,
        ...args: T_ipcSignatureMap['rendererToMainWithoutResponse'][Key]['argTypes']
      ) => func(...args);
      ipcMain.on(identifier, subscription);

      return () => {
        ipcMain.removeListener(identifier, subscription);
      };
    },
    handle<Key extends keyof T_ipcSignatureMap['rendererToMainWithResponse']>(
      identifier: Key & IPCKeyType,
      func: (
        ...args: T_ipcSignatureMap['rendererToMainWithResponse'][Key]['argTypes']
      ) => Promise<
        T_ipcSignatureMap['rendererToMainWithResponse'][Key]['returnType']
      >,
    ): () => void {
      const subscription = (
        _event: IpcMainInvokeEvent,
        ...args: T_ipcSignatureMap['rendererToMainWithResponse'][Key]['argTypes']
      ) => func(...args);
      ipcMain.handle(identifier, subscription);
      return () => {
        ipcMain.removeHandler(identifier);
      };
    },
  };
}
