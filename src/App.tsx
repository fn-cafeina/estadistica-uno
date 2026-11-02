import { LabProvider } from "./lab/LabContext";
import { Lab } from "./lab/Lab";

export function App() {
  return (
    <LabProvider>
      <Lab />
    </LabProvider>
  );
}
