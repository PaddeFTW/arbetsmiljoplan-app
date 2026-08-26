import { MagicGate } from "@/components/auth/MagicGate";
import { PlanApp } from "@/components/plan/PlanApp";
export default function HomePage() {
  return (
    <MagicGate productName="arbetsmiljöplanen">
      <PlanApp />
    </MagicGate>
  );
}
