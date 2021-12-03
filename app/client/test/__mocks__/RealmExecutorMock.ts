// __mocks__/RealmExecutor.ts
// Import this named export into your test file:
export const mockExecute = jest.fn().mockImplementation((src, data) => {
  let finalSource = "let ";
  Object.keys(data).forEach((key) => {
    finalSource += ` ${key} = ${JSON.stringify(data[key])}, `;
  });
  finalSource = finalSource.substring(0, finalSource.length - 2) + ";";
  finalSource += src;
  return { result: eval(finalSource), triggers: [] };
});

export const mockRegisterLibrary = jest.fn();
