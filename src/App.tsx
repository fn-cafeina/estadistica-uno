import { SampleProvider } from "./state/SampleContext";
import { Presentation } from "./presentation/Presentation";

export function App() {
  return (
    <SampleProvider>
      <Presentation />
    </SampleProvider>
  );
}
