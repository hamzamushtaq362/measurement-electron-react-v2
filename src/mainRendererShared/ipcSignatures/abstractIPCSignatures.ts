export type IPCKeyType = string;
export type IPCSignatureMap = {
  rendererToMainWithResponse: {
    [Key: IPCKeyType]: { argTypes: any[]; returnType: any };
  };
  rendererToMainWithoutResponse: {
    [Key: IPCKeyType]: { argTypes: any[] };
  };
  mainToRendererWithResponse: {
    [Key: IPCKeyType]: { argTypes: any[]; returnType: any };
  };
  mainToRendererWithoutResponse: {
    [Key: IPCKeyType]: { argTypes: any[] };
  };
};
