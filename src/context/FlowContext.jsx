import { createContext, useContext, useState } from 'react';

const FlowContext = createContext(null);
export const useFlow = () => useContext(FlowContext);

export function FlowProvider({ children }) {
  const [flow, setFlow] = useState(null);
  return <FlowContext.Provider value={{ flow, setFlow }}>{children}</FlowContext.Provider>;
}
